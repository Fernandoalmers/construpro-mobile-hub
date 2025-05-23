
import { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { searchCustomers } from '@/services/vendor/customers';
import { CustomerData } from '../CustomerSearch';
import { toast } from '@/components/ui/sonner';

export const useCustomerSelection = () => {
  const location = useLocation();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [relationId, setRelationId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<CustomerData[]>([]);

  // Check for clientId in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const clienteId = params.get('customerId') || params.get('clienteId');
    if (clienteId) {
      console.log('Client ID found in URL:', clienteId);
      
      // Search for the customer to get the usuario_id
      searchCustomers(clienteId).then(results => {
        console.log('Search results for client ID:', results);
        if (results && results.length > 0) {
          // Map to ensure it matches CustomerData interface
          const customerData: CustomerData[] = results.map(customer => ({
            id: customer.id,
            nome: customer.nome || 'Usuário',
            telefone: customer.telefone,
            email: customer.email,
            cpf: customer.cpf,
            usuario_id: customer.usuario_id,
            vendedor_id: customer.vendedor_id,
            total_gasto: customer.total_gasto || 0
          }));
          
          setSearchResults(customerData);
          
          // Use the usuario_id for the profile operations
          if (customerData[0]?.usuario_id) {
            setSelectedCustomerId(customerData[0].usuario_id);
            setRelationId(customerData[0].id);
            toast.success(`Cliente ${customerData[0].nome} selecionado com sucesso`);
          } else {
            toast.error('Cliente não encontrado ou sem ID de usuário');
          }
        } else {
          toast.error('Cliente não encontrado');
        }
      }).catch(error => {
        console.error('Error fetching customer details:', error);
        toast.error('Erro ao buscar detalhes do cliente');
      });
    }
  }, [location]);

  const handleSelectCustomer = useCallback((customer: CustomerData) => {
    console.log('Selected customer in hook:', customer);
    
    // Validate and use the usuario_id (profile ID) for operations, not the relation ID
    if (!customer.usuario_id) {
      console.error('Error: Customer has no valid usuario_id:', customer);
      toast.error('Este cliente não tem um ID de usuário válido');
      return;
    }
    
    // Store both IDs separately
    setRelationId(customer.id);
    setSelectedCustomerId(customer.usuario_id);
    setSearchResults([customer]);
    
    toast.success(`Cliente ${customer.nome} selecionado`);
  }, []);

  return {
    selectedCustomerId,
    relationId,
    searchResults,
    selectedCustomer: searchResults.find(c => c.id === relationId),
    handleSelectCustomer
  };
};
