
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../common/Card';
import CustomInput from '../common/CustomInput';
import CustomButton from '../common/CustomButton';
import ListEmptyState from '../common/ListEmptyState';
import Avatar from '../common/Avatar';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Plus, Minus } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import clientes from '../../data/clientes.json';
import ajustes from '../../data/ajustes.json';

const AjustePontosVendorScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [pontos, setPontos] = useState('');
  const [motivo, setMotivo] = useState('');
  const [isPositiveAdjustment, setIsPositiveAdjustment] = useState(true);

  // Filter clients based on search
  const filteredClientes = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.cpf.includes(searchTerm) ||
    cliente.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedClient = selectedClientId 
    ? clientes.find(cliente => cliente.id === selectedClientId) 
    : null;

  // Get recent adjustments for the selected client
  const clientAdjustments = selectedClientId
    ? ajustes.filter(ajuste => ajuste.clienteId === selectedClientId)
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    : [];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setSearchTerm('');
  };

  const handlePontosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^0-9]/g, '');
    setPontos(value);
  };

  const toggleAdjustmentType = () => {
    setIsPositiveAdjustment(!isPositiveAdjustment);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClientId || !pontos || !motivo) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }
    
    // In a real app, this would send the adjustment to the backend
    toast({
      title: "Ajuste registrado!",
      description: `${isPositiveAdjustment ? 'Adicionado' : 'Removido'} ${pontos} pontos para o cliente.`,
    });
    
    // Reset form
    setPontos('');
    setMotivo('');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-white p-4 flex items-center shadow-sm">
        <button onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Ajuste de Pontos</h1>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Client Search */}
        <Card className="p-4">
          <h2 className="font-bold mb-3">Buscar cliente</h2>
          <CustomInput
            isSearch
            placeholder="Nome, CPF ou código"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          
          {searchTerm && (
            <div className="mt-4 max-h-60 overflow-y-auto">
              {filteredClientes.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {filteredClientes.map(cliente => (
                    <div
                      key={cliente.id}
                      className="py-2 flex items-center cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSelectClient(cliente.id)}
                    >
                      <Avatar
                        src={cliente.avatar}
                        fallback={cliente.nome}
                        size="sm"
                        className="mr-3"
                      />
                      <div>
                        <p className="font-medium">{cliente.nome}</p>
                        <div className="text-xs text-gray-500">
                          <span>CPF: {cliente.cpf}</span>
                          <span className="mx-2">•</span>
                          <span>Código: {cliente.codigo}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-gray-500">
                  Nenhum cliente encontrado
                </p>
              )}
            </div>
          )}
        </Card>
        
        {/* Selected Client */}
        {selectedClient && (
          <Card className="p-4">
            <div className="flex items-center">
              <Avatar
                src={selectedClient.avatar}
                fallback={selectedClient.nome}
                size="md"
                className="mr-4"
              />
              <div>
                <h3 className="font-bold">{selectedClient.nome}</h3>
                <p className="text-sm text-gray-600">{selectedClient.cpf}</p>
                <div className="mt-1 flex items-center">
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded mr-2">
                    Código: {selectedClient.codigo}
                  </span>
                  <span className="text-xs bg-construPro-orange/10 text-construPro-orange px-2 py-0.5 rounded">
                    {selectedClient.saldoPontos} pontos
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}
        
        {/* Adjustment Form */}
        {selectedClient && (
          <Card className="p-4">
            <h2 className="font-bold mb-4">Ajustar Pontos</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de ajuste
                </label>
                <div className="flex">
                  <button
                    type="button"
                    className={`flex-1 py-2 px-4 text-center border ${
                      isPositiveAdjustment
                        ? 'bg-green-100 border-green-300 text-green-700'
                        : 'bg-white border-gray-300 text-gray-700'
                    } rounded-l-md flex items-center justify-center`}
                    onClick={() => setIsPositiveAdjustment(true)}
                  >
                    <Plus size={16} className="mr-1" /> Adicionar
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-2 px-4 text-center border ${
                      !isPositiveAdjustment
                        ? 'bg-red-100 border-red-300 text-red-700'
                        : 'bg-white border-gray-300 text-gray-700'
                    } rounded-r-md flex items-center justify-center`}
                    onClick={() => setIsPositiveAdjustment(false)}
                  >
                    <Minus size={16} className="mr-1" /> Remover
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade de pontos
                </label>
                <Input
                  value={pontos}
                  onChange={handlePontosChange}
                  placeholder="Ex: 500"
                  className="w-full"
                  type="text"
                  inputMode="numeric"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo
                </label>
                <Input
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ex: Compra na loja física"
                  className="w-full"
                  required
                />
              </div>
              
              <CustomButton
                variant="primary"
                type="submit"
                fullWidth
              >
                {isPositiveAdjustment ? 'Adicionar' : 'Remover'} Pontos
              </CustomButton>
            </form>
          </Card>
        )}
        
        {/* Recent Adjustments */}
        {selectedClient && (
          <div>
            <h2 className="font-bold text-lg text-gray-800 mb-3">Histórico de ajustes</h2>
            
            {clientAdjustments.length > 0 ? (
              <Card className="overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {clientAdjustments.map(ajuste => (
                    <div key={ajuste.id} className="p-4">
                      <div className="flex justify-between items-center">
                        <p className={`font-medium ${ajuste.pontos >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {ajuste.pontos >= 0 ? '+' : ''}{ajuste.pontos} pontos
                        </p>
                        <span className="text-sm text-gray-500">
                          {new Date(ajuste.data).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{ajuste.motivo}</p>
                      <p className="text-xs text-gray-500 mt-1">Vendedor: {ajuste.vendedor}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <ListEmptyState
                title="Sem histórico"
                description="Este cliente ainda não teve ajustes de pontos."
                className="bg-white"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AjustePontosVendorScreen;
