
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Eye, Edit2, SortDesc, Download, RefreshCw, UserPlus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import CustomInput from '../common/CustomInput';
import CustomButton from '../common/CustomButton';
import Avatar from '../common/Avatar';
import ListEmptyState from '../common/ListEmptyState';
import { useQuery } from '@tanstack/react-query';
import { getVendorCustomers, VendorCustomer, migrateCustomersFromPointAdjustments, migrateCustomersFromOrders, findCustomerByEmail } from '@/services/vendorCustomersService';
import LoadingState from '../common/LoadingState';
import { toast } from '@/components/ui/sonner';

const ClientesVendorScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'nome' | 'total_gasto'>('total_gasto');
  const [isImporting, setIsImporting] = useState(false);
  const [emailSearch, setEmailSearch] = useState('');
  const [isSearchingEmail, setIsSearchingEmail] = useState(false);
  
  // Fetch customers
  const { data: customers = [], isLoading, error, refetch } = useQuery({
    queryKey: ['vendorCustomers'],
    queryFn: getVendorCustomers,
    staleTime: 1 * 60 * 1000, // 1 minute para atualizar regularmente
  });
  
  // Filter and sort customers
  const filteredClients = customers
    .filter(cliente => 
      searchTerm === '' || 
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.telefone?.includes(searchTerm)
    )
    .sort((a, b) => {
      if (sortBy === 'nome') {
        return a.nome.localeCompare(b.nome);
      } else if (sortBy === 'total_gasto') {
        return b.total_gasto - a.total_gasto;
      }
      return 0;
    });

  const handleAjustarPontos = (clienteId: string) => {
    navigate(`/vendor/ajuste-pontos?clienteId=${clienteId}`);
  };
  
  const handleViewExtrato = (clienteId: string) => {
    navigate(`/vendor/clientes/${clienteId}/extrato`);
  };

  const handleMigrateFromOrders = async () => {
    setIsImporting(true);
    toast.loading("Importando clientes dos pedidos...");
    
    try {
      const result = await migrateCustomersFromOrders();
      if (result) {
        toast.success("Clientes importados com sucesso dos pedidos existentes!");
        refetch();
      } else {
        toast.error("Não foi possível importar clientes dos pedidos");
      }
    } catch (error) {
      console.error("Erro ao importar clientes:", error);
      toast.error("Erro ao importar clientes dos pedidos");
    } finally {
      setIsImporting(false);
    }
  };
  
  const handleMigrateFromAdjustments = async () => {
    setIsImporting(true);
    toast.loading("Importando clientes dos ajustes de pontos...");
    
    try {
      const result = await migrateCustomersFromPointAdjustments();
      if (result) {
        toast.success("Clientes importados com sucesso dos ajustes de pontos!");
        refetch();
      } else {
        toast.error("Não foi possível importar clientes dos ajustes");
      }
    } catch (error) {
      console.error("Erro ao importar clientes:", error);
      toast.error("Erro ao importar clientes dos ajustes");
    } finally {
      setIsImporting(false);
    }
  };

  const handleEmailSearch = async () => {
    if (!emailSearch || emailSearch.trim() === '') {
      toast.error("Digite um email para buscar");
      return;
    }
    
    setIsSearchingEmail(true);
    toast.loading(`Buscando cliente pelo email: ${emailSearch}`);
    
    try {
      const result = await findCustomerByEmail(emailSearch);
      if (result) {
        toast.success(`Cliente encontrado: ${result.nome}`);
        refetch();
      } else {
        toast.error(`Não foi encontrado cliente com email: ${emailSearch}`);
      }
    } catch (error) {
      console.error("Erro ao buscar cliente por email:", error);
      toast.error("Erro ao buscar cliente por email");
    } finally {
      setIsSearchingEmail(false);
    }
  };

  if (isLoading) {
    return <LoadingState text="Carregando clientes..." />;
  }
  
  if (error) {
    console.error('Error fetching customers:', error);
    return (
      <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
        <div className="bg-white p-4 flex items-center shadow-sm">
          <button onClick={() => navigate('/vendor')} className="mr-4">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Clientes</h1>
        </div>
        <div className="p-6 flex flex-col items-center justify-center">
          <p className="text-red-500 mb-4">Erro ao carregar clientes</p>
          <CustomButton onClick={() => refetch()}>
            Tentar novamente
          </CustomButton>
        </div>
      </div>
    );
  }

  // Calculate stats
  const recentCustomersCount = customers.filter(c => 
    c.ultimo_pedido && 
    new Date().getTime() - new Date(c.ultimo_pedido).getTime() < 30 * 24 * 60 * 60 * 1000
  ).length;
  
  const totalPointsGiven = customers.reduce((sum, client) => {
    // Total points is not directly available, this is just an approximate
    return sum + (client.total_gasto > 0 ? Math.floor(client.total_gasto / 10) : 0);
  }, 0);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-white p-4 flex items-center shadow-sm">
        <button onClick={() => navigate('/vendor')} className="mr-4">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Clientes</h1>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Alert for import options */}
        {customers.length === 0 && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertTitle className="text-blue-800">Nenhum cliente encontrado</AlertTitle>
            <AlertDescription className="text-blue-700">
              Você ainda não possui clientes na sua lista. Utilize os botões abaixo para importar clientes de pedidos existentes ou ajustes de pontos.
            </AlertDescription>
            <div className="flex flex-wrap gap-2 mt-3">
              <CustomButton 
                variant="primary"
                onClick={handleMigrateFromOrders}
                disabled={isImporting}
                icon={<Download size={16} />}
              >
                {isImporting ? "Importando..." : "Importar clientes dos pedidos"}
              </CustomButton>
              <CustomButton 
                variant="outline"
                onClick={handleMigrateFromAdjustments}
                disabled={isImporting}
              >
                {isImporting ? "Importando..." : "Importar dos ajustes de pontos"}
              </CustomButton>
            </div>
          </Alert>
        )}

        {/* Search by email section */}
        <Card className="p-4">
          <h3 className="font-medium mb-2">Buscar cliente por email</h3>
          <div className="flex gap-2">
            <CustomInput
              placeholder="Email do cliente..."
              value={emailSearch}
              onChange={(e) => setEmailSearch(e.target.value)}
              className="w-full"
            />
            <CustomButton
              variant="primary"
              onClick={handleEmailSearch}
              disabled={isSearchingEmail || !emailSearch}
              icon={<UserPlus size={16} />}
            >
              {isSearchingEmail ? "Buscando..." : "Buscar"}
            </CustomButton>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Se o cliente existir no sistema mas não estiver vinculado à sua loja, ele será adicionado automaticamente.
          </p>
        </Card>

        {/* Import and refresh actions - Always show migration button */}
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <h3 className="font-medium text-yellow-800 mb-2">Diagnóstico e correção de problemas</h3>
          <p className="text-xs text-yellow-700 mb-3">
            Se você não está vendo seus clientes ou se acha que faltam dados, você pode tentar importar novamente.
          </p>
          <div className="flex flex-wrap gap-2">
            <CustomButton 
              variant="primary"
              onClick={handleMigrateFromOrders}
              disabled={isImporting}
              icon={<Download size={16} />}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {isImporting ? "Importando..." : "MIGRAR CLIENTES DE PEDIDOS"}
            </CustomButton>
            <CustomButton 
              variant="outline"
              onClick={() => refetch()}
              icon={<RefreshCw size={16} />}
            >
              Atualizar lista
            </CustomButton>
          </div>
        </Card>

        {/* Search and filters */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <CustomInput
            placeholder="Buscar por nome, email ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            isSearch
            className="w-full sm:w-2/3"
          />
          
          <div className="flex space-x-2">
            <button
              onClick={() => setSortBy('nome')}
              className={`px-3 py-1 text-sm rounded-full flex items-center ${
                sortBy === 'nome' 
                  ? 'bg-construPro-blue text-white' 
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              <span className="mr-1">Nome</span>
              {sortBy === 'nome' && <SortDesc size={14} />}
            </button>
            
            <button
              onClick={() => setSortBy('total_gasto')}
              className={`px-3 py-1 text-sm rounded-full flex items-center ${
                sortBy === 'total_gasto' 
                  ? 'bg-construPro-blue text-white' 
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              <span className="mr-1">Maiores compradores</span>
              {sortBy === 'total_gasto' && <SortDesc size={14} />}
            </button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <p className="text-gray-500 text-sm">Total de clientes</p>
            <p className="text-xl font-bold">{customers.length}</p>
          </Card>
          
          <Card className="p-4 text-center">
            <p className="text-gray-500 text-sm">Clientes recentes</p>
            <p className="text-xl font-bold">{recentCustomersCount}</p>
          </Card>
          
          <Card className="p-4 text-center">
            <p className="text-gray-500 text-sm">Pontos distribuídos</p>
            <p className="text-xl font-bold">{totalPointsGiven}</p>
          </Card>
        </div>
        
        {/* Client List */}
        <div className="space-y-4">
          <h2 className="font-bold text-lg">Lista de clientes</h2>
          
          {filteredClients.length > 0 ? (
            <div className="space-y-3">
              {filteredClients.map((cliente) => (
                <Card key={cliente.id} className="p-4">
                  <div className="flex items-center">
                    <Avatar
                      src={undefined}
                      fallback={cliente.nome}
                      size="md"
                      className="mr-4"
                    />
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold">{cliente.nome}</h3>
                          <p className="text-sm text-gray-600">{cliente.telefone || cliente.email || 'Sem contato'}</p>
                        </div>
                        
                        <div className="flex">
                          <button
                            onClick={() => handleViewExtrato(cliente.usuario_id)}
                            className="p-2 mr-2 text-blue-600 hover:bg-blue-50 rounded"
                            title="Ver extrato"
                          >
                            <Eye size={18} />
                          </button>
                          
                          <button
                            onClick={() => handleAjustarPontos(cliente.usuario_id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded"
                            title="Ajustar pontos"
                          >
                            <Edit2 size={18} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex flex-wrap gap-2 text-sm">
                        <div className="bg-gray-100 px-2 py-1 rounded">
                          <span className="font-medium">Compras:</span>{' '}
                          <span>R$ {cliente.total_gasto.toFixed(2)}</span>
                        </div>
                        
                        {cliente.ultimo_pedido && (
                          <div className="bg-gray-100 px-2 py-1 rounded">
                            <span className="font-medium">Última compra:</span>{' '}
                            <span>{new Date(cliente.ultimo_pedido).toLocaleDateString('pt-BR')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <ListEmptyState
              icon={<Search className="h-12 w-12 text-gray-400" />}
              title="Nenhum cliente encontrado"
              description={searchTerm ? "Nenhum cliente corresponde aos critérios de busca." : "Ainda não há clientes registrados."}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientesVendorScreen;
