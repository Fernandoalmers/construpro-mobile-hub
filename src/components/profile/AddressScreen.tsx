
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Plus, Edit2, Trash2 } from 'lucide-react';
import Card from '../common/Card';
import CustomButton from '../common/CustomButton';
import ListEmptyState from '../common/ListEmptyState';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '../../context/AuthContext';
import AddAddressModal from './AddAddressModal';

// Mock addresses for demonstration
const mockAddresses = [
  {
    id: '1',
    nome: 'Casa',
    cep: '01310-200',
    logradouro: 'Av. Paulista',
    numero: '1000',
    complemento: 'Apto 123',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    estado: 'SP',
    principal: true,
  },
  {
    id: '2',
    nome: 'Trabalho',
    cep: '04538-132',
    logradouro: 'Av. Brigadeiro Faria Lima',
    numero: '3477',
    complemento: '5º andar',
    bairro: 'Itaim Bibi',
    cidade: 'São Paulo',
    estado: 'SP',
    principal: false,
  }
];

const AddressScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [addresses, setAddresses] = useState(mockAddresses);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);

  const handleSetDefaultAddress = (addressId: string) => {
    setAddresses(addresses.map(address => ({
      ...address,
      principal: address.id === addressId
    })));
    toast({
      title: "Endereço principal alterado",
      description: "O endereço foi definido como principal com sucesso.",
    });
  };

  const handleEditAddress = (address: any) => {
    setEditingAddress(address);
    setIsAddModalOpen(true);
  };

  const handleDeleteAddress = (addressId: string) => {
    setAddresses(addresses.filter(address => address.id !== addressId));
    toast({
      title: "Endereço removido",
      description: "O endereço foi removido com sucesso.",
      variant: "destructive",
    });
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setIsAddModalOpen(true);
  };

  const handleSaveAddress = (address: any) => {
    if (editingAddress) {
      // Update existing address
      setAddresses(addresses.map(a => 
        a.id === editingAddress.id ? { ...address, id: editingAddress.id } : a
      ));
      toast({
        title: "Endereço atualizado",
        description: "O endereço foi atualizado com sucesso.",
      });
    } else {
      // Add new address
      const newAddress = {
        ...address,
        id: `address-${Date.now()}`,
        principal: addresses.length === 0 // First address is default
      };
      setAddresses([...addresses, newAddress]);
      toast({
        title: "Endereço adicionado",
        description: "O endereço foi adicionado com sucesso.",
      });
    }
    setIsAddModalOpen(false);
  };

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

        {addresses.length === 0 ? (
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
                      onClick={() => handleDeleteAddress(address.id)}
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
                    onClick={() => handleSetDefaultAddress(address.id)}
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
