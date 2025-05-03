
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../common/Card';
import CustomInput from '../common/CustomInput';
import CustomButton from '../common/CustomButton';
import ListEmptyState from '../common/ListEmptyState';
import Avatar from '../common/Avatar';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Plus, Minus, History } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  searchCustomers,
  getCustomerPoints,
  getPointAdjustments,
  createPointAdjustment,
  VendorCustomer,
  PointAdjustment
} from '@/services/vendorService';

interface CustomerData {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  cpf?: string;
}

const AjustePontosVendorScreen: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [pontos, setPontos] = useState('');
  const [motivo, setMotivo] = useState('');
  const [isPositiveAdjustment, setIsPositiveAdjustment] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<CustomerData[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Get customer's points
  const { data: customerPoints = 0 } = useQuery({
    queryKey: ['customerPoints', selectedCustomerId],
    queryFn: () => selectedCustomerId ? getCustomerPoints(selectedCustomerId) : Promise.resolve(0),
    enabled: !!selectedCustomerId,
  });

  // Get point adjustments history for the selected customer
  const { data: adjustments = [] } = useQuery({
    queryKey: ['pointAdjustments', selectedCustomerId],
    queryFn: () => selectedCustomerId ? getPointAdjustments(selectedCustomerId) : Promise.resolve([]),
    enabled: !!selectedCustomerId,
  });

  // Create point adjustment mutation
  const createAdjustmentMutation = useMutation({
    mutationFn: (data: { userId: string, tipo: string, valor: number, motivo: string }) => 
      createPointAdjustment(data.userId, data.tipo, data.valor, data.motivo),
    onSuccess: () => {
      toast.success(isPositiveAdjustment ? 'Pontos adicionados com sucesso!' : 'Pontos removidos com sucesso!');
      setPontos('');
      setMotivo('');
      
      // Invalidate queries to update data
      queryClient.invalidateQueries({ queryKey: ['customerPoints', selectedCustomerId] });
      queryClient.invalidateQueries({ queryKey: ['pointAdjustments', selectedCustomerId] });
    },
    onError: (error) => {
      toast.error('Erro ao ajustar pontos. Tente novamente.');
      console.error('Error creating point adjustment:', error);
    }
  });

  // Handle search for customers
  useEffect(() => {
    const searchCustomersDebounced = async () => {
      if (searchTerm.length < 3) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }
      
      setIsSearching(true);
      try {
        const results = await searchCustomers(searchTerm);
        setSearchResults(results);
        setShowSearchResults(true);
      } catch (error) {
        console.error('Error searching customers:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchCustomersDebounced, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSelectCustomer = (customer: CustomerData) => {
    setSelectedCustomerId(customer.id);
    setSearchTerm('');
    setShowSearchResults(false);
  };

  const handlePontosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^0-9]/g, '');
    setPontos(value);
  };

  const toggleAdjustmentType = () => {
    setIsPositiveAdjustment(!isPositiveAdjustment);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomerId || !pontos || !motivo) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }
    
    const pontosValue = parseInt(pontos);
    if (isNaN(pontosValue) || pontosValue <= 0) {
      toast.error('O valor de pontos deve ser maior que zero.');
      return;
    }
    
    // If removing points, check if customer has enough points
    if (!isPositiveAdjustment && pontosValue > customerPoints) {
      toast.error(`O cliente possui apenas ${customerPoints} pontos disponíveis.`);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await createAdjustmentMutation.mutateAsync({
        userId: selectedCustomerId,
        tipo: isPositiveAdjustment ? 'adicao' : 'remocao',
        valor: isPositiveAdjustment ? pontosValue : -pontosValue,
        motivo
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-white p-4 flex items-center shadow-sm">
        <button onClick={() => navigate('/vendor')} className="mr-4">
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
            placeholder="Nome, CPF ou e-mail"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          
          {isSearching && (
            <div className="mt-4 text-center">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-sm text-gray-500">Buscando clientes...</p>
            </div>
          )}
          
          {showSearchResults && (
            <div className="mt-4 max-h-60 overflow-y-auto">
              {searchResults.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {searchResults.map(customer => (
                    <div
                      key={customer.id}
                      className="py-2 flex items-center cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSelectCustomer(customer)}
                    >
                      <Avatar
                        src={undefined}
                        fallback={customer.nome}
                        size="sm"
                        className="mr-3"
                      />
                      <div>
                        <p className="font-medium">{customer.nome}</p>
                        <div className="text-xs text-gray-500">
                          {customer.cpf && <><span>CPF: {customer.cpf}</span><span className="mx-2">•</span></>}
                          <span>{customer.email || customer.telefone || ''}</span>
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
        {selectedCustomerId && (
          <Card className="p-4">
            <div className="flex items-center">
              <Avatar
                src={undefined}
                fallback={searchResults.find(c => c.id === selectedCustomerId)?.nome || 'Cliente'}
                size="md"
                className="mr-4"
              />
              <div>
                <h3 className="font-bold">{searchResults.find(c => c.id === selectedCustomerId)?.nome || 'Cliente'}</h3>
                <p className="text-sm text-gray-600">{searchResults.find(c => c.id === selectedCustomerId)?.cpf || ''}</p>
                <div className="mt-1 flex items-center">
                  {searchResults.find(c => c.id === selectedCustomerId)?.email && (
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded mr-2">
                      {searchResults.find(c => c.id === selectedCustomerId)?.email}
                    </span>
                  )}
                  <span className="text-xs bg-construPro-orange/10 text-construPro-orange px-2 py-0.5 rounded">
                    {customerPoints} pontos
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}
        
        {/* Adjustment Form */}
        {selectedCustomerId && (
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
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processando...' : `${isPositiveAdjustment ? 'Adicionar' : 'Remover'} Pontos`}
              </CustomButton>
            </form>
          </Card>
        )}
        
        {/* Recent Adjustments */}
        {selectedCustomerId && (
          <div>
            <div className="flex items-center mb-3">
              <History size={18} className="mr-2 text-gray-800" />
              <h2 className="font-bold text-lg text-gray-800">Histórico de ajustes</h2>
            </div>
            
            {adjustments.length > 0 ? (
              <Card className="overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {adjustments.map((adjustment: PointAdjustment) => (
                    <div key={adjustment.id} className="p-4">
                      <div className="flex justify-between items-center">
                        <p className={`font-medium ${adjustment.valor >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {adjustment.valor >= 0 ? '+' : ''}{adjustment.valor} pontos
                        </p>
                        <span className="text-sm text-gray-500">
                          {new Date(adjustment.created_at!).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{adjustment.motivo}</p>
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
