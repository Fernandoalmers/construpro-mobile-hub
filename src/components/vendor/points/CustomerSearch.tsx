
import React, { useState, useEffect } from 'react';
import { Search, X, Check, Loader2, User } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import Avatar from '../../common/Avatar';
import CustomInput from '../../common/CustomInput';
import { searchCustomers } from '@/services/vendorCustomersService';
import { searchCustomerProfiles } from '@/services/vendor/points/customerManager';
import { VendorCustomer } from '@/services/vendorCustomersService';

export interface CustomerData {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  cpf?: string;
  usuario_id: string;
  vendedor_id: string;
  total_gasto: number;
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

  // Handle search for customers with debounce
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 3) {
      setShowSearchResults(false);
      setNoResultsFound(false);
      return;
    }
    
    const searchCustomersDebounced = async () => {
      setIsSearching(true);
      setNoResultsFound(false);
      
      try {
        console.log('Searching for customers with term:', searchTerm);
        
        // Try searching in vendor's customers first
        let results = await searchCustomers(searchTerm);
        
        // If no results, try searching in all profiles as a fallback
        if (results.length === 0) {
          console.log('No vendor customers found, searching all profiles');
          const profileResults = await searchCustomerProfiles(searchTerm);
          
          // Map profile results to VendorCustomer format
          results = profileResults.map(profile => ({
            id: profile.id,
            usuario_id: profile.id, // Use profile id as usuario_id
            nome: profile.nome || 'Usuário',
            telefone: profile.telefone,
            email: profile.email,
            cpf: profile.cpf, // This should now be valid with the updated interface
            vendedor_id: '', // Empty string for now
            total_gasto: 0 // Default to 0
          }));
        }
        
        console.log('Combined search results:', results);
        
        setSearchResults(results || []);
        setShowSearchResults(true);
        setNoResultsFound(results.length === 0);
      } catch (error) {
        console.error('Error searching customers:', error);
        toast.error('Erro ao buscar clientes. Tente novamente.');
        setNoResultsFound(true);
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
      setNoResultsFound(false);
    }
  };

  const handleSearch = () => {
    if (searchTerm.length >= 3) {
      setIsSearching(true);
      setNoResultsFound(false);
      
      searchCustomers(searchTerm)
        .then(results => {
          setSearchResults(results || []);
          setShowSearchResults(true);
          setNoResultsFound(results.length === 0);
          setIsSearching(false);
        })
        .catch(error => {
          console.error('Error searching customers:', error);
          toast.error('Erro ao buscar clientes. Tente novamente.');
          setNoResultsFound(true);
          setIsSearching(false);
        });
    } else {
      toast.error('Digite pelo menos 3 caracteres para buscar');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectCustomer = (customer: CustomerData) => {
    console.log('Selected customer:', customer);
    console.log('DEBUG - Important IDs:', {
      relation_id: customer.id,
      usuario_id: customer.usuario_id,
      vendedor_id: customer.vendedor_id
    });
    
    // Make sure we're passing the usuario_id, not the relation id
    if (!customer.usuario_id) {
      console.error('WARNING: Selected customer has no usuario_id!', customer);
      toast.error('Erro: Cliente sem ID de usuário válido');
      return;
    }
    
    onSelectCustomer(customer);
    setSearchTerm('');
    setSearchResults([]);
    setShowSearchResults(false);
    setNoResultsFound(false);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setShowSearchResults(false);
    setNoResultsFound(false);
  };

  return (
    <div className="p-4">
      <div className="flex gap-2 mb-1">
        <div className="relative flex-1">
          <CustomInput
            placeholder="Nome, CPF, e-mail ou telefone"
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
                    fallback={customer.nome?.charAt(0) || 'U'}
                    size="sm"
                    className="mr-3 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-gray-900 truncate">{customer.nome || 'Usuário'}</p>
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
      
      {noResultsFound && !isSearching && searchTerm.length >= 3 && (
        <div className="mt-4 text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
          <User className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm text-gray-700 font-medium">
            Nenhum cliente encontrado
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
