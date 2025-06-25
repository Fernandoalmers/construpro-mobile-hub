
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Plus, RefreshCw } from 'lucide-react';
import CustomButton from '../common/CustomButton';
import ListEmptyState from '../common/ListEmptyState';
import ErrorState from '../common/ErrorState';
import AddAddressModal from './AddAddressModal';
import { useAddresses } from '@/hooks/useAddresses';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/use-toast';

const AddressScreen: React.FC = () => {
  const navigate = useNavigate();
  const {
    addresses,
    isLoading,
    error,
    errorDetails,
    refetch,
    isAddModalOpen,
    setIsAddModalOpen,
    editingAddress,
    handleSetDefaultAddress,
    handleEditAddress,
    handleDeleteAddress,
    handleAddAddress,
    handleSaveAddress,
    isSettingPrimary
  } = useAddresses();

  // Handle retry with a user-friendly message
  const handleRetry = () => {
    toast({
      title: "Tentando novamente",
      description: "Atualizando seus endereços..."
    });
    refetch();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header - Fixed at top */}
      <div className="bg-construPro-blue p-6 pt-12 w-full">
        <div className="flex items-center mb-4">
          <button onClick={() => navigate('/profile')} className="text-white">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-white ml-2">Meus Endereços</h1>
        </div>
      </div>
      
      {/* Scrollable Content Area */}
      <ScrollArea className="flex-1 overflow-y-auto pb-24">
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
          ) : error ? (
            <ErrorState
              title="Erro ao carregar endereços"
              message="Não foi possível carregar seus endereços. Por favor, verifique sua conexão e tente novamente."
              errorDetails={errorDetails || undefined}
              onRetry={handleRetry}
              retryText="Tentar novamente"
            />
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
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm text-gray-500">Total: {addresses.length} endereços</div>
                <button 
                  onClick={handleRetry}
                  className="flex items-center text-sm text-construPro-blue hover:text-construPro-blue-dark"
                >
                  <RefreshCw size={16} className="mr-1" />
                  Atualizar
                </button>
              </div>
              {addresses.map((address) => (
                <div key={address.id} className="bg-white rounded-lg shadow-md p-4">
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
                        aria-label="Editar endereço"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(address.id!)}
                        className={`text-gray-500 hover:text-red-500 ${address.principal ? 'opacity-40 cursor-not-allowed' : ''}`}
                        disabled={address.principal}
                        aria-label="Remover endereço"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
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
                      loading={isSettingPrimary}
                      disabled={isSettingPrimary}
                    >
                      {isSettingPrimary ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-construPro-blue border-t-transparent rounded-full animate-spin" />
                          Definindo...
                        </div>
                      ) : (
                        'Definir como principal'
                      )}
                    </CustomButton>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

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
