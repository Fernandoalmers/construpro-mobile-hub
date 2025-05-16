
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Avatar from '../common/Avatar';

interface CustomerData {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  cpf?: string;
}

const AjustePontosVendorScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
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

  // Verificar se há um clientId na URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const clienteId = params.get('clienteId');
    if (clienteId) {
      setSelectedCustomerId(clienteId);
      // Buscar dados do cliente para exibir
      searchCustomers(clienteId).then(results => {
        if (results.length > 0) {
          setSearchResults(results);
        }
      }).catch(error => {
        console.error('Error fetching customer details:', error);
      });
    }
  }, [location]);

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
        console.log('Searching for customers with term:', searchTerm);
        const results = await searchCustomers(searchTerm);
        console.log('Search results:', results);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Nome, CPF ou e-mail"
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
          
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
        {selectedCustomerId && searchResults.find(c => c.id === selectedCustomerId) && (
          <>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Avatar
                    src={undefined}
                    fallback={searchResults.find(c => c.id === selectedCustomerId)?.nome || 'Cliente'}
                    size="md"
                    className="mr-4"
                  />
                  <div>
                    <h3 className="font-bold">{searchResults.find(c => c.id === selectedCustomerId)?.nome}</h3>
                    <p className="text-sm text-gray-600">
                      {searchResults.find(c => c.id === selectedCustomerId)?.email || 
                       searchResults.find(c => c.id === selectedCustomerId)?.telefone || 
                       'Sem contato'}
                    </p>
                  </div>
                </div>
                <div>
                  <div className="text-center bg-blue-50 px-4 py-2 rounded-lg">
                    <p className="text-xs text-blue-600">Saldo de Pontos</p>
                    <p className="text-xl font-bold text-blue-700">{customerPoints}</p>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Points Adjustment Form */}
            <Card className="p-4">
              <h3 className="font-bold mb-4">Ajustar Pontos</h3>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <div className="flex mb-2">
                      <Button
                        type="button"
                        variant={isPositiveAdjustment ? "default" : "outline"}
                        className="flex-1 rounded-r-none"
                        onClick={() => setIsPositiveAdjustment(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Adicionar
                      </Button>
                      <Button
                        type="button"
                        variant={!isPositiveAdjustment ? "default" : "outline"}
                        className="flex-1 rounded-l-none"
                        onClick={() => setIsPositiveAdjustment(false)}
                      >
                        <Minus className="mr-2 h-4 w-4" /> Remover
                      </Button>
                    </div>
                    <Input
                      value={pontos}
                      onChange={handlePontosChange}
                      placeholder="Quantidade de pontos"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Motivo
                    </label>
                    <Textarea
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder="Descreva o motivo do ajuste de pontos"
                      required
                      rows={3}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Processando...' : 'Confirmar Ajuste'}
                  </Button>
                </div>
              </form>
            </Card>
            
            {/* History */}
            <div>
              <div className="flex items-center mb-2">
                <History size={16} className="mr-2 text-gray-500" />
                <h3 className="font-bold">Histórico de Ajustes</h3>
              </div>
              
              {adjustments.length > 0 ? (
                <div className="space-y-3">
                  {adjustments.map(adjustment => (
                    <Card key={adjustment.id} className="p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className={`font-medium ${adjustment.valor >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {adjustment.valor >= 0 ? '+' : ''}{adjustment.valor} pontos
                          </p>
                          <p className="text-sm text-gray-600">{adjustment.motivo}</p>
                        </div>
                        <div className="text-xs text-gray-500">
                          {adjustment.created_at ? formatDate(adjustment.created_at) : ''}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-3 text-center text-gray-500">
                  Nenhum ajuste de pontos registrado
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AjustePontosVendorScreen;
