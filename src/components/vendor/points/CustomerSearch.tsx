import React, { useState, useEffect } from 'react';
import { Search, X, Check, Loader2, User, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import Avatar from '../../common/Avatar';
import CustomInput from '../../common/CustomInput';
import { supabase } from '@/integrations/supabase/client';
import { searchAllProfiles, ensureCustomerRelationship } from '@/services/vendor/customers/customerSearchService';

export interface CustomerData {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  cpf?: string;
  usuario_id: string;
  vendedor_id: string;
  total_gasto: number;
  ultimo_pedido?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface CustomerSearchProps {
  onSelectCustomer: (customer: CustomerData) => void;
}

const CustomerSearch: React.FC<CustomerSearchProps> = ({ onSelectCustomer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<CustomerData[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [noResultsFound, setNoResultsFound] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Enhanced search with debounce
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 6) {
      setShowSearchResults(false);
      setNoResultsFound(false);
      setSearchError(null);
      return;
    }
    
    const searchUsersDebounced = async () => {
      setIsSearching(true);
      setNoResultsFound(false);
      setSearchError(null);
      
      try {
        console.log('🔍 [CustomerSearch] Starting search for:', searchTerm);
        
        // Use the enhanced search that looks in all profiles
        const results = await searchAllProfiles(searchTerm);
        
        console.log('✅ [CustomerSearch] Search completed with results:', results.length);
        
        setSearchResults(results || []);
        setShowSearchResults(true);
        setNoResultsFound(results.length === 0);
        
        if (results.length === 0) {
          console.log('📭 [CustomerSearch] No results found for query:', searchTerm);
        }
      } catch (error) {
        console.error('❌ [CustomerSearch] Search failed:', error);
        setSearchError('Erro ao buscar usuários. Tente novamente.');
        setNoResultsFound(true);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchUsersDebounced, 400);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (e.target.value.length === 0) {
      setSearchResults([]);
      setShowSearchResults(false);
      setNoResultsFound(false);
      setSearchError(null);
    }
  };

  const handleSearch = () => {
    if (searchTerm.length >= 6) {
      setIsSearching(true);
      setNoResultsFound(false);
      setSearchError(null);
      
      searchAllProfiles(searchTerm)
        .then(results => {
          setSearchResults(results || []);
          setShowSearchResults(true);
          setNoResultsFound(results.length === 0);
          setIsSearching(false);
        })
        .catch(error => {
          console.error('❌ [CustomerSearch] Search error:', error);
          setSearchError('Erro ao buscar usuários. Tente novamente.');
          setNoResultsFound(true);
          setIsSearching(false);
        });
    } else {
      toast.error('Digite pelo menos 6 caracteres para buscar todos os usuários');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectCustomer = async (customer: CustomerData) => {
    console.log('🎯 [CustomerSearch] Selected customer:', customer);
    
    if (!customer.usuario_id) {
      console.error('❌ [CustomerSearch] Customer has no valid usuario_id!', customer);
      toast.error('Erro: Cliente sem ID de usuário válido');
      return;
    }
    
    // If this is a new customer (no existing relationship), create it
    if (!customer.vendedor_id || !customer.id) {
      try {
        console.log('🔗 [CustomerSearch] Creating new customer relationship for:', customer.usuario_id);
        
        // Get current vendor ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error('Erro de autenticação');
          return;
        }
        
        const { data: vendorData } = await supabase
          .from('vendedores')
          .select('id')
          .eq('usuario_id', user.id)
          .single();
          
        if (!vendorData) {
          toast.error('Vendedor não encontrado');
          return;
        }
        
        // Create customer relationship
        const relationId = await ensureCustomerRelationship(
          vendorData.id,
          customer.usuario_id,
          {
            nome: customer.nome,
            email: customer.email,
            telefone: customer.telefone,
            cpf: customer.cpf
          }
        );
        
        if (!relationId) {
          toast.error('Erro ao criar relacionamento com cliente');
          return;
        }
        
        // Update customer data with new relationship info
        const updatedCustomer: CustomerData = {
          ...customer,
          id: relationId,
          vendedor_id: vendorData.id
        };
        
        console.log('✅ [CustomerSearch] Updated customer with new relationship:', updatedCustomer);
        onSelectCustomer(updatedCustomer);
      } catch (error) {
        console.error('❌ [CustomerSearch] Error creating customer relationship:', error);
        toast.error('Erro ao selecionar cliente');
        return;
      }
    } else {
      // Existing customer, proceed normally
      console.log('✅ [CustomerSearch] Selecting existing customer:', customer);
      onSelectCustomer(customer);
    }
    
    setSearchTerm('');
    setSearchResults([]);
    setShowSearchResults(false);
    setNoResultsFound(false);
    setSearchError(null);
    
    toast.success(`Cliente ${customer.nome} selecionado`);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setShowSearchResults(false);
    setNoResultsFound(false);
    setSearchError(null);
  };

  // Check if customer is frequent (has existing relationship)
  const isFrequentCustomer = (customer: CustomerData) => {
    return customer.vendedor_id && customer.id;
  };

  return (
    <div className="p-4">
      <div className="flex gap-2 mb-1">
        <div className="relative flex-1">
          <CustomInput
            placeholder="Nome, CPF, e-mail ou telefone (mín. 6 caracteres)"
            value={searchTerm}
            onChange={handleSearchChange}
            isSearch
            onKeyPress={handleKeyPress}
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
          disabled={searchTerm.length < 6 || isSearching}
          className="flex items-center gap-2"
        >
          {isSearching ? <Loader2 className="animate-spin h-4 w-4" /> : <Search className="h-4 w-4" />}
          <span className="hidden sm:inline">Buscar</span>
        </Button>
      </div>
      
      {searchTerm && searchTerm.length < 6 && (
        <p className="text-xs text-gray-500 mt-1">
          Digite pelo menos 6 caracteres para buscar todos os usuários
        </p>
      )}
      
      {isSearching && (
        <div className="mt-4 text-center py-2">
          <Loader2 className="animate-spin h-5 w-5 mx-auto text-blue-600" />
          <p className="mt-2 text-sm text-gray-500">Buscando usuários...</p>
        </div>
      )}
      
      {searchError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle size={16} />
            <span className="text-sm font-medium">Erro na busca</span>
          </div>
          <p className="text-xs text-red-600 mt-1">{searchError}</p>
          <p className="text-xs text-red-500 mt-2">
            Verifique o console do navegador (F12) para mais detalhes técnicos.
          </p>
        </div>
      )}
      
      {showSearchResults && !isSearching && !searchError && (
        <div className="mt-2 max-h-60 overflow-y-auto rounded-md border border-gray-200">
          {searchResults.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {searchResults.map(customer => (
                <div
                  key={customer.usuario_id}
                  className="py-3 px-3 flex items-center cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleSelectCustomer(customer)}
                >
                  <Avatar
                    src={undefined}
                    fallback={customer.nome?.charAt(0) || 'U'}
                    size="sm"
                    className="mr-3 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {customer.nome || 'Usuário'}
                      {isFrequentCustomer(customer) ? (
                        <span className="ml-2 text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                          Cliente frequente
                        </span>
                      ) : (
                        <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                          Novo cliente
                        </span>
                      )}
                    </p>
                    <div className="text-xs text-gray-500 flex flex-wrap gap-x-2">
                      {customer.cpf && <span className="truncate">CPF: {customer.cpf}</span>}
                      {customer.email && <span className="truncate">{customer.email}</span>}
                      {customer.telefone && <span className="truncate">{customer.telefone}</span>}
                    </div>
                    {isFrequentCustomer(customer) && customer.total_gasto > 0 && (
                      <div className="text-xs text-gray-400 mt-1">
                        Total gasto: R$ {customer.total_gasto.toFixed(2)}
                      </div>
                    )}
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
                Nenhum usuário encontrado
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Verifique os dados informados e tente novamente
              </p>
            </div>
          )}
        </div>
      )}
      
      {noResultsFound && !isSearching && searchTerm.length >= 6 && !searchError && (
        <div className="mt-4 text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
          <User className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm text-gray-700 font-medium">
            Nenhum usuário encontrado
          </p>
          <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
            Verifique se os dados informados estão corretos e tente novamente.
          </p>
        </div>
      )}
    </div>
  );
};

export default CustomerSearch;
