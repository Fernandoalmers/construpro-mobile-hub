
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SearchX, Users, UserPlus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getVendorCustomers, VendorCustomer, seedTestCustomers } from '@/services/vendorCustomersService';
import LoadingState from '../common/LoadingState';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from '@/components/ui/sonner';
import VendorPagination from './common/VendorPagination';
import { usePagination } from '@/hooks/vendor/usePagination';

const EnhancedCustomersScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isSeeding, setIsSeeding] = useState(false);

  // Fetch customers data with explicit refetch interval
  const { 
    data: customers = [], 
    isLoading, 
    error, 
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['vendorCustomers'],
    queryFn: getVendorCustomers,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Debug effect to log customers data
  useEffect(() => {
    console.log('EnhancedCustomersScreen - customers data:', customers);
  }, [customers]);

  // Filter customers based on search and tab
  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = searchTerm 
      ? customer.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.telefone?.includes(searchTerm)
      : true;
    
    const matchesTab = 
      activeTab === 'all' ? true : 
      activeTab === 'recent' ? new Date(customer.ultimo_pedido || 0) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) :
      activeTab === 'high-value' ? customer.total_gasto > 1000 : true;
    
    return matchesSearch && matchesTab;
  });

  // Setup pagination
  const { 
    currentPage, 
    totalPages, 
    paginatedItems: paginatedCustomers, 
    onPageChange 
  } = usePagination(filteredCustomers, 10);

  // View customer details
  const handleViewCustomer = (customerId: string) => {
    navigate(`/vendor/customers/${customerId}`);
  };

  // Handle customer search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // Reset to first page when searching
    onPageChange(1);
  };

  // Handle adding points
  const handleAddPoints = (customerId: string) => {
    navigate(`/vendor/points-adjustment?customerId=${customerId}`);
  };

  // Force refresh data
  const handleForceRefresh = async () => {
    toast.loading('Atualizando dados dos clientes...');
    
    // Clear React Query cache for this query
    await refetch();
    
    toast.success('Dados atualizados com sucesso!');
  };

  // Seed test customers (for development only)
  const handleSeedTestCustomers = async () => {
    if (isSeeding) return;
    
    setIsSeeding(true);
    toast.loading('Criando clientes de teste...');
    
    try {
      const success = await seedTestCustomers(5);
      if (success) {
        toast.success('Clientes de teste criados com sucesso!');
        refetch();
      } else {
        toast.error('Erro ao criar clientes de teste');
      }
    } catch (error) {
      console.error('Error seeding customers:', error);
      toast.error('Erro ao criar clientes de teste');
    } finally {
      setIsSeeding(false);
    }
  };

  if (isLoading) return <LoadingState text="Carregando clientes..." />;

  if (error) {
    console.error('Error fetching customers:', error);
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold mb-4 text-red-500">Erro ao carregar clientes</h2>
          <p className="mb-4 text-gray-600">Ocorreu um erro ao tentar carregar a lista de clientes.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button onClick={() => refetch()}>Tentar novamente</Button>
            <Button variant="outline" onClick={handleSeedTestCustomers} disabled={isSeeding}>
              {isSeeding ? 'Criando...' : 'Criar clientes de teste'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      <div className="bg-white p-4 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold">Clientes</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleForceRefresh}
              disabled={isRefetching}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button onClick={() => navigate('/vendor')}>
              Voltar para o Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Input
              className="pl-10 pr-4 py-2"
              placeholder="Buscar por nome, email ou telefone..."
              value={searchTerm}
              onChange={handleSearch}
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Users size={16} />
            </span>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="all" className="font-medium">
                Todos os Clientes
              </TabsTrigger>
              <TabsTrigger value="recent" className="font-medium">
                Compras Recentes
              </TabsTrigger>
              <TabsTrigger value="high-value" className="font-medium">
                Alto Valor
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 flex flex-col">
            <span className="text-gray-500 mb-1">Total de Clientes</span>
            <span className="text-2xl font-bold">{customers.length}</span>
          </Card>
          <Card className="p-4 flex flex-col">
            <span className="text-gray-500 mb-1">Clientes Ativos (30 dias)</span>
            <span className="text-2xl font-bold">
              {customers.filter(c => new Date(c.ultimo_pedido || 0) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
            </span>
          </Card>
          <Card className="p-4 flex flex-col">
            <span className="text-gray-500 mb-1">Valor Médio por Cliente</span>
            <span className="text-2xl font-bold">
              R$ {(customers.reduce((sum, c) => sum + (c.total_gasto || 0), 0) / Math.max(1, customers.length)).toFixed(2)}
            </span>
          </Card>
        </div>

        {/* Customers List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-lg">Lista de Clientes</h2>
            {customers.length === 0 && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleSeedTestCustomers}
                disabled={isSeeding}
              >
                {isSeeding ? 'Criando...' : 'Criar clientes de teste'}
              </Button>
            )}
          </div>
          
          {paginatedCustomers.length === 0 ? (
            <Card className="p-8 text-center">
              <SearchX className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum cliente encontrado</h3>
              <p className="text-gray-500 mb-4">
                {customers.length === 0 
                  ? 'Você ainda não possui nenhum cliente registrado.' 
                  : 'Não encontramos clientes que correspondam a esse filtro.'}
              </p>
              {searchTerm && (
                <Button 
                  variant="outline" 
                  onClick={() => setSearchTerm('')}
                >
                  Limpar filtro
                </Button>
              )}
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-full align-middle">
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contato
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Último Pedido
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Gasto
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedCustomers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-gray-50 cursor-pointer">
                          <td className="px-6 py-4 whitespace-nowrap" onClick={() => handleViewCustomer(customer.id)}>
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-full flex items-center justify-center">
                                {customer.nome?.[0]?.toUpperCase() || "C"}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {customer.nome || "Cliente"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {customer.id.substring(0, 8)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap" onClick={() => handleViewCustomer(customer.id)}>
                            <div className="text-sm text-gray-900">{customer.email || "—"}</div>
                            <div className="text-sm text-gray-500">{customer.telefone || "—"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap" onClick={() => handleViewCustomer(customer.id)}>
                            <div className="text-sm text-gray-900">
                              {customer.ultimo_pedido ? new Date(customer.ultimo_pedido).toLocaleDateString() : "Nunca"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap" onClick={() => handleViewCustomer(customer.id)}>
                            <div className="text-sm text-gray-900 font-medium">
                              R$ {customer.total_gasto?.toFixed(2) || "0.00"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <Button
                              variant="outline"
                              size="sm"
                              className="mr-2"
                              onClick={() => handleViewCustomer(customer.id)}
                            >
                              Ver Detalhes
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddPoints(customer.usuario_id);
                              }}
                              title="Adicionar ou remover pontos para este cliente"
                            >
                              <UserPlus className="h-4 w-4 mr-1" /> Pontos
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {/* Pagination */}
          {paginatedCustomers.length > 0 && (
            <VendorPagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedCustomersScreen;
