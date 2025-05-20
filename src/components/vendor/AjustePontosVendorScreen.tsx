import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Minus, History, User, Loader2, X, Check } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  searchCustomers,
  getCustomerPoints,
  getPointAdjustments,
  createPointAdjustment,
} from '@/services/vendorService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Avatar from '../common/Avatar';
import CustomInput from '../common/CustomInput';

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
  const [activeTab, setActiveTab] = useState('form');

  // Check for clientId in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const clienteId = params.get('clienteId');
    if (clienteId) {
      setSelectedCustomerId(clienteId);
      // Fetch customer data to display
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
  const { data: customerPoints = 0, isLoading: isLoadingPoints } = useQuery({
    queryKey: ['customerPoints', selectedCustomerId],
    queryFn: () => selectedCustomerId ? getCustomerPoints(selectedCustomerId) : Promise.resolve(0),
    enabled: !!selectedCustomerId,
  });

  // Get point adjustments history for the selected customer
  const { 
    data: adjustments = [], 
    isLoading: isLoadingAdjustments 
  } = useQuery({
    queryKey: ['pointAdjustments', selectedCustomerId],
    queryFn: () => selectedCustomerId ? getPointAdjustments(selectedCustomerId) : Promise.resolve([]),
    enabled: !!selectedCustomerId,
  });

  // Create point adjustment mutation
  const createAdjustmentMutation = useMutation({
    mutationFn: (data: { userId: string, tipo: 'adicao' | 'remocao', valor: number, motivo: string }) => 
      createPointAdjustment(data.userId, data.tipo, data.valor, data.motivo),
    onSuccess: () => {
      toast.success(isPositiveAdjustment ? 'Pontos adicionados com sucesso!' : 'Pontos removidos com sucesso!');
      setPontos('');
      setMotivo('');
      
      // Invalidate queries to update data
      queryClient.invalidateQueries({ queryKey: ['customerPoints', selectedCustomerId] });
      queryClient.invalidateQueries({ queryKey: ['pointAdjustments', selectedCustomerId] });
      
      // Switch to history tab after successful adjustment
      setActiveTab('history');
    },
    onError: (error) => {
      toast.error('Erro ao ajustar pontos. Tente novamente.');
      console.error('Error creating point adjustment:', error);
    }
  });

  // Handle search for customers with debounce
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 3) {
      setShowSearchResults(false);
      return;
    }
    
    const searchCustomersDebounced = async () => {
      setIsSearching(true);
      try {
        console.log('Searching for customers with term:', searchTerm);
        const results = await searchCustomers(searchTerm);
        console.log('Search results:', results);
        setSearchResults(results);
        setShowSearchResults(true);
      } catch (error) {
        console.error('Error searching customers:', error);
        toast.error('Erro ao buscar clientes. Tente novamente.');
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchCustomersDebounced, 400);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (e.target.value.length === 0) {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleSearch = () => {
    if (searchTerm.length >= 3) {
      setIsSearching(true);
      searchCustomers(searchTerm)
        .then(results => {
          setSearchResults(results);
          setShowSearchResults(true);
          setIsSearching(false);
        })
        .catch(error => {
          console.error('Error searching customers:', error);
          toast.error('Erro ao buscar clientes. Tente novamente.');
          setIsSearching(false);
        });
    } else {
      toast.error('Digite pelo menos 3 caracteres para buscar');
    }
  };

  const handleSelectCustomer = (customer: CustomerData) => {
    setSelectedCustomerId(customer.id);
    setSearchTerm('');
    setShowSearchResults(false);
    // Switch to form tab when a customer is selected
    setActiveTab('form');
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
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

  const selectedCustomer = searchResults.find(c => c.id === selectedCustomerId);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white p-4 flex items-center shadow-sm sticky top-0 z-10">
        <button onClick={() => navigate('/vendor')} className="mr-4 hover:bg-gray-100 p-2 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">Ajuste de Pontos</h1>
      </div>
      
      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {/* Client Search Card */}
        <Card className="overflow-visible">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg">Buscar cliente</h2>
          </div>
          
          <div className="p-4">
            <div className="flex gap-2 mb-1">
              <div className="relative flex-1">
                <CustomInput
                  placeholder="Nome, CPF, e-mail ou telefone"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  isSearch
                  className="w-full pr-10"
                />
                {searchTerm && (
                  <button 
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={searchTerm.length < 3 || isSearching}
                className="flex items-center gap-2"
              >
                {isSearching ? <Loader2 className="animate-spin h-4 w-4" /> : <Search className="h-4 w-4" />}
                <span className="hidden sm:inline">Buscar</span>
              </Button>
            </div>
            
            {searchTerm && searchTerm.length < 3 && (
              <p className="text-xs text-gray-500 mt-1">
                Digite pelo menos 3 caracteres para buscar
              </p>
            )}
            
            {isSearching && (
              <div className="mt-4 text-center py-2">
                <Loader2 className="animate-spin h-5 w-5 mx-auto text-blue-600" />
                <p className="mt-2 text-sm text-gray-500">Buscando clientes...</p>
              </div>
            )}
            
            {showSearchResults && !isSearching && (
              <div className="mt-2 max-h-60 overflow-y-auto rounded-md border border-gray-200">
                {searchResults.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {searchResults.map(customer => (
                      <div
                        key={customer.id}
                        className="py-3 px-3 flex items-center cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => handleSelectCustomer(customer)}
                      >
                        <Avatar
                          src={undefined}
                          fallback={customer.nome || 'U'}
                          size="sm"
                          className="mr-3 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm text-gray-900 truncate">{customer.nome}</p>
                          <div className="text-xs text-gray-500 flex flex-wrap gap-x-2">
                            {customer.cpf && <span className="truncate">CPF: {customer.cpf}</span>}
                            {customer.email && <span className="truncate">{customer.email}</span>}
                            {customer.telefone && <span className="truncate">{customer.telefone}</span>}
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="ml-2 flex-shrink-0">
                          <Check size={16} />
                          <span className="sr-only">Selecionar</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <User className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      Nenhum cliente encontrado
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Verifique os dados informados e tente novamente
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
        
        {/* Selected Client Information */}
        {selectedCustomerId && selectedCustomer && (
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-blue-50 border-b border-blue-100">
              <div className="flex items-center">
                <Avatar
                  src={undefined}
                  fallback={selectedCustomer.nome || 'Cliente'}
                  size="md"
                  className="mr-4"
                />
                <div>
                  <h3 className="font-bold">{selectedCustomer.nome}</h3>
                  <div className="flex flex-col sm:flex-row sm:gap-3 text-sm text-gray-600">
                    {selectedCustomer.email && <span>{selectedCustomer.email}</span>}
                    {selectedCustomer.telefone && <span>{selectedCustomer.telefone}</span>}
                    {selectedCustomer.cpf && <span>CPF: {selectedCustomer.cpf}</span>}
                  </div>
                </div>
              </div>
              <div className="text-center bg-white px-4 py-2 rounded-lg shadow-sm">
                <p className="text-xs text-blue-600 font-medium">Saldo de Pontos</p>
                {isLoadingPoints ? (
                  <div className="flex justify-center my-1">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <p className="text-xl font-bold text-blue-700">{customerPoints}</p>
                )}
              </div>
            </div>
  
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-4 pt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="form">Ajustar Pontos</TabsTrigger>
                  <TabsTrigger value="history">Histórico</TabsTrigger>
                </TabsList>
              </div>
  
              <TabsContent value="form" className="p-4 pt-2 focus:outline-none">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <Button
                        type="button"
                        variant={isPositiveAdjustment ? "default" : "outline"}
                        onClick={() => setIsPositiveAdjustment(true)}
                        className="flex items-center justify-center gap-2"
                      >
                        <Plus className="h-4 w-4" /> 
                        <span>Adicionar</span>
                      </Button>
                      <Button
                        type="button"
                        variant={!isPositiveAdjustment ? "default" : "outline"}
                        onClick={() => setIsPositiveAdjustment(false)}
                        className="flex items-center justify-center gap-2"
                      >
                        <Minus className="h-4 w-4" /> 
                        <span>Remover</span>
                      </Button>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">
                          {isPositiveAdjustment ? "+" : "-"}
                        </span>
                      </div>
                      <Input
                        value={pontos}
                        onChange={handlePontosChange}
                        placeholder="Quantidade de pontos"
                        className="pl-8"
                        required
                      />
                    </div>
                    
                    {!isPositiveAdjustment && (
                      <p className="text-xs text-gray-500 mt-1">
                        {customerPoints > 0 
                          ? `Cliente possui ${customerPoints} pontos disponíveis` 
                          : 'Cliente não possui pontos disponíveis'}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Motivo <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder="Descreva o motivo do ajuste de pontos"
                      required
                      rows={3}
                    />
                    <p className="text-xs text-gray-500">
                      Informe detalhes que ajudem a identificar este ajuste no futuro
                    </p>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting || !pontos || !motivo || (
                      !isPositiveAdjustment && parseInt(pontos) > customerPoints
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      `Confirmar ${isPositiveAdjustment ? 'Adição' : 'Remoção'} de Pontos`
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="history" className="p-4 pt-0 focus:outline-none">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 py-2">
                    <History size={16} className="text-gray-500" />
                    <h3 className="font-medium text-gray-700">Histórico de Ajustes</h3>
                  </div>
                  
                  {isLoadingAdjustments ? (
                    <div className="py-8 text-center">
                      <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-600" />
                      <p className="mt-2 text-sm text-gray-500">Carregando histórico...</p>
                    </div>
                  ) : adjustments.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {adjustments.map(adjustment => (
                        <Card key={adjustment.id} className="p-3 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className={`font-medium ${adjustment.valor > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {adjustment.valor > 0 ? '+' : ''}{adjustment.valor} pontos
                              </p>
                              <p className="text-sm text-gray-600 mt-1">{adjustment.motivo}</p>
                            </div>
                            <div className="text-xs text-gray-500 whitespace-nowrap ml-2">
                              {adjustment.created_at ? formatDate(adjustment.created_at) : ''}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">
                        Nenhum ajuste de pontos registrado
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        )}
  
        {/* Instructions when no customer is selected */}
        {!selectedCustomerId && !isSearching && searchResults.length === 0 && (
          <Card className="p-6 text-center border border-dashed border-gray-300 bg-gray-50">
            <Search className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Busque um cliente</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Utilize o campo de busca acima para encontrar um cliente pelo nome, CPF, 
              e-mail ou telefone e realizar o ajuste de pontos.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AjustePontosVendorScreen;
