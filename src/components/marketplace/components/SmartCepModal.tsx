
import React, { useState } from 'react';
import { MapPin, Plus, ChevronRight, Loader2 } from 'lucide-react';
import CustomModal from '@/components/common/CustomModal';
import { useAddresses } from '@/hooks/useAddresses';
import { useAuth } from '@/context/AuthContext';
import TempCepInput from './TempCepInput';
import AddAddressModal from '@/components/profile/AddAddressModal';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

interface SmartCepModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCepChange: (cep: string) => void;
  currentCep?: string | null;
}

const SmartCepModal: React.FC<SmartCepModalProps> = ({
  open,
  onOpenChange,
  onCepChange,
  currentCep
}) => {
  const { isAuthenticated } = useAuth();
  const { addresses, isLoading } = useAddresses();
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [isChangingCep, setIsChangingCep] = useState(false);

  const hasAddresses = addresses.length > 0;
  const formatCep = (cep: string) => cep.replace(/(\d{5})(\d{3})/, '$1-$2');

  const handleAddressSelect = async (cep: string) => {
    if (isChangingCep) return;
    
    setIsChangingCep(true);
    console.log('[SmartCepModal] Alterando CEP para:', cep);
    
    try {
      // Aguardar a resolução das zonas e invalidação das queries
      await onCepChange(cep);
      
      toast({
        title: "✅ CEP alterado com sucesso",
        description: `Produtos atualizados para ${formatCep(cep)}`
      });
      
      // Aguardar um pouco para garantir que as queries sejam revalidadas
      setTimeout(() => {
        onOpenChange(false);
      }, 500);
      
    } catch (error) {
      console.error('[SmartCepModal] Erro ao alterar CEP:', error);
      toast({
        variant: "destructive",
        title: "❌ Erro ao alterar CEP",
        description: "Tente novamente em alguns instantes"
      });
    } finally {
      setIsChangingCep(false);
    }
  };

  const handleTempCepSubmit = async (cep: string) => {
    await handleAddressSelect(cep);
  };

  const handleAddAddress = () => {
    setShowAddAddressModal(true);
  };

  // Para usuários não autenticados, sempre mostrar input de CEP
  if (!isAuthenticated) {
    return (
      <CustomModal
        open={open}
        onOpenChange={onOpenChange}
        title="Definir CEP de Entrega"
        description="Digite seu CEP para ver produtos disponíveis na sua região"
        size="md"
      >
        <div className="space-y-4">
          {currentCep && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  CEP atual: <strong>{formatCep(currentCep)}</strong>
                </span>
              </div>
            </div>
          )}
          
          {isChangingCep && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Atualizando produtos...</span>
            </div>
          )}
          
          <TempCepInput 
            onCepSubmit={handleTempCepSubmit}
            loading={isChangingCep}
          />
        </div>
      </CustomModal>
    );
  }

  // Para usuários autenticados sem endereços - incentivar cadastro
  if (!isLoading && !hasAddresses) {
    return (
      <>
        <CustomModal
          open={open}
          onOpenChange={onOpenChange}
          title="Cadastre seu primeiro endereço"
          description="Para ver produtos disponíveis na sua região, cadastre um endereço de entrega"
          size="md"
        >
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-gray-600 mb-6">
                Você ainda não possui endereços cadastrados. Adicione seu primeiro endereço para começar a comprar!
              </p>
              <Button
                onClick={handleAddAddress}
                className="w-full bg-construPro-blue hover:bg-construPro-blue-dark"
                disabled={isChangingCep}
              >
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar primeiro endereço
              </Button>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-3">
                Ou digite um CEP temporariamente:
              </p>
              
              {isChangingCep && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg mb-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Atualizando produtos...</span>
                </div>
              )}
              
              <TempCepInput 
                onCepSubmit={handleTempCepSubmit}
                loading={isChangingCep}
              />
            </div>
          </div>
        </CustomModal>

        <AddAddressModal
          open={showAddAddressModal}
          onOpenChange={setShowAddAddressModal}
          onSave={() => {
            setShowAddAddressModal(false);
            // Fechar também o modal principal após salvar
            setTimeout(() => onOpenChange(false), 500);
          }}
        />
      </>
    );
  }

  // Para usuários autenticados com endereços - mostrar lista
  return (
    <>
      <CustomModal
        open={open}
        onOpenChange={onOpenChange}
        title="Selecionar Endereço de Entrega"
        description="Escolha um endereço ou digite um novo CEP"
        size="md"
      >
        <div className="space-y-4">
          {currentCep && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">
                  CEP atual: <strong>{formatCep(currentCep)}</strong>
                </span>
              </div>
            </div>
          )}

          {isChangingCep && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Atualizando produtos...</span>
            </div>
          )}

          {/* Lista de endereços cadastrados */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Seus endereços cadastrados:
            </h4>
            
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {addresses.map((address) => (
                  <button
                    key={address.id}
                    onClick={() => handleAddressSelect(address.cep)}
                    disabled={isChangingCep}
                    className="w-full p-3 text-left bg-white border border-gray-200 rounded-lg hover:border-construPro-blue hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{address.nome}</span>
                          {address.principal && (
                            <span className="text-xs bg-construPro-blue text-white px-2 py-0.5 rounded-full">
                              Principal
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {address.logradouro}, {address.numero} - {address.bairro}
                        </p>
                        <p className="text-sm text-gray-500">
                          {address.cidade} - {address.estado} | CEP: {formatCep(address.cep)}
                        </p>
                      </div>
                      {isChangingCep ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botão para adicionar novo endereço */}
          <button
            onClick={handleAddAddress}
            disabled={isChangingCep}
            className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-construPro-blue hover:text-construPro-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4 mx-auto mb-1" />
            <span className="text-sm">Cadastrar novo endereço</span>
          </button>

          {/* Input para CEP temporário */}
          <div className="border-t pt-4">
            <p className="text-sm text-gray-500 mb-3">
              Ou digite um CEP diferente:
            </p>
            <TempCepInput 
              onCepSubmit={handleTempCepSubmit}
              loading={isChangingCep}
            />
          </div>
        </div>
      </CustomModal>

      <AddAddressModal
        open={showAddAddressModal}
        onOpenChange={setShowAddAddressModal}
        onSave={() => {
          setShowAddAddressModal(false);
        }}
      />
    </>
  );
};

export default SmartCepModal;
