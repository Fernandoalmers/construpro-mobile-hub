
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Plus, Edit2, Trash2 } from 'lucide-react';
import Card from '../common/Card';
import CustomButton from '../common/CustomButton';
import ListEmptyState from '../common/ListEmptyState';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '../../context/AuthContext';
import AddAddressModal from './AddAddressModal';
import { addressService, Address } from '@/services/addressService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const AddressScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Fetch addresses
  const { 
    data: addresses = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressService.getAddresses(),
  });

  // Delete address mutation
  const deleteAddressMutation = useMutation({
    mutationFn: (addressId: string) => addressService.deleteAddress(addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success("Endereço removido com sucesso");
    },
    onError: (error) => {
      toast.error(`Erro ao remover endereço: ${error.message}`);
    }
  });

  // Set primary address mutation
  const setPrimaryAddressMutation = useMutation({
    mutationFn: (addressId: string) => addressService.setPrimaryAddress(addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success("Endereço principal atualizado com sucesso");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar endereço principal: ${error.message}`);
    }
  });

  // Save address mutation
  const saveAddressMutation = useMutation({
    mutationFn: (data: { address: Address, isEdit: boolean }) => {
      if (data.isEdit && data.address.id) {
        return addressService.updateAddress(data.address.id, data.address);
      } else {
        return addressService.addAddress(data.address);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success(
        variables.isEdit 
          ? "Endereço atualizado com sucesso" 
          : "Endereço adicionado com sucesso"
      );
      setIsAddModalOpen(false);
    },
    onError: (error) => {
      toast.error(`Erro ao salvar endereço: ${error.message}`);
    }
  });

  const handleSetDefaultAddress = (addressId: string) => {
    setPrimaryAddressMutation.mutate(addressId);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setIsAddModalOpen(true);
  };

  const handleDeleteAddress = (addressId: string) => {
    if (window.confirm('Tem certeza que deseja remover este endereço?')) {
      deleteAddressMutation.mutate(addressId);
    }
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setIsAddModalOpen(true);
  };

  const handleSaveAddress = (address: Address) => {
    saveAddressMutation.mutate({ 
      address, 
      isEdit: Boolean(editingAddress) 
    });
  };

  if (error) {
    toast.error(`Erro ao carregar endereços: ${(error as Error).message}`);
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-construPro-blue p-6 pt-12">
        <div className="flex items-center mb-4">
          <button onClick={() => navigate('/profile')} className="text-white">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-white ml-2">Meus Endereços</h1>
        </div>
      </div>
      
      {/* Address List */}
      <div className="p-6">
        <CustomButton
          variant="primary"
          icon={<Plus size={18} />}
          onClick={handleAddAddress}
          className="mb-4"
          fullWidth
        >
          Adicionar novo endereço
        </CustomButton>

        {isLoading ? (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-construPro-blue"></div>
          </div>
        ) : addresses.length === 0 ? (
          <ListEmptyState
            title="Nenhum endereço cadastrado"
            description="Adicione um endereço para receber suas compras e resgates."
            icon={<MapPin size={40} />}
            action={{
              label: "Adicionar endereço",
              onClick: handleAddAddress
            }}
          />
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <Card key={address.id} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <h3 className="font-medium">{address.nome}</h3>
                    {address.principal && (
                      <span className="ml-2 bg-construPro-blue text-white text-xs px-2 py-0.5 rounded-full">
                        Principal
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditAddress(address)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteAddress(address.id!)}
                      className="text-gray-500 hover:text-red-500"
                      disabled={address.principal}
                    >
                      <Trash2 size={16} className={address.principal ? 'opacity-40' : ''} />
                    </button>
                  </div>
                </div>
                
                <p className="text-sm text-gray-700">
                  {address.logradouro}, {address.numero}
                  {address.complemento && `, ${address.complemento}`}
                </p>
                <p className="text-sm text-gray-700">
                  {address.bairro}, {address.cidade} - {address.estado}
                </p>
                <p className="text-sm text-gray-700">CEP: {address.cep}</p>
                
                {!address.principal && (
                  <CustomButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetDefaultAddress(address.id!)}
                    className="mt-3"
                  >
                    Definir como principal
                  </CustomButton>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <AddAddressModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSave={handleSaveAddress}
        initialData={editingAddress}
      />
    </div>
  );
};

export default AddressScreen;
