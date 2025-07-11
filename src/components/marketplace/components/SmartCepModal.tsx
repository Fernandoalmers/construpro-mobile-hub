
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
  const { isAuthenticated, user, refreshProfile } = useAuth();
  const { addresses, isLoading, refetch, handleSaveAddress } = useAddresses();
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [isChangingCep, setIsChangingCep] = useState(false);
  const [changingAddressId, setChangingAddressId] = useState<string | null>(null);
  const [isUpdatingPrimary, setIsUpdatingPrimary] = useState(false);

  const hasAddresses = addresses.length > 0;
  const formatCep = (cep: string) => cep.replace(/(\d{5})(\d{3})/, '$1-$2');

  // NOVO: Função para disparar evento de mudança de endereço
  const dispatchAddressChangeEvent = (newCep: string) => {
    console.log('[SmartCepModal] 🚀 Disparando evento primary-address-changed:', newCep);
    
    const event = new CustomEvent('primary-address-changed', {
      detail: { newCep: newCep.replace(/\D/g, '') }
    });
    
    window.dispatchEvent(event);
  };

  const handleAddressSelect = async (cep: string, addressId?: string) => {
    if (isChangingCep) return;
    
    setIsChangingCep(true);
    setChangingAddressId(addressId || null);
    
    try {
      // Se é um endereço cadastrado, definir como principal primeiro
      if (addressId && user?.id) {
        console.log('[SmartCepModal] 🏠 Definindo endereço como principal:', addressId);
        setIsUpdatingPrimary(true);
        
        const { addressService } = await import('@/services/addressService');
        
        // Definir como endereço principal
        await addressService.setPrimaryAddress(addressId, user.id);
        
        console.log('[SmartCepModal] ⏳ Aguardando sincronização completa...');
        
        // MELHORADO: Aguardar mais tempo para garantir sincronização
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // MELHORADO: Múltiplas tentativas de refresh do perfil
        let profileUpdated = false;
        let attempts = 0;
        const maxAttempts = 3;
        
        while (!profileUpdated && attempts < maxAttempts) {
          attempts++;
          console.log(`[SmartCepModal] 🔄 Tentativa ${attempts} de refresh do perfil...`);
          
          const updatedProfile = await refreshProfile();
          
          if (updatedProfile?.endereco_principal?.cep === cep.replace(/\D/g, '')) {
            console.log('[SmartCepModal] ✅ Perfil sincronizado com sucesso!');
            profileUpdated = true;
          } else {
            console.log(`[SmartCepModal] ⏳ Aguardando sincronização... (tentativa ${attempts})`);
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 800));
            }
          }
        }
        
        if (!profileUpdated) {
          console.warn('[SmartCepModal] ⚠️ Perfil pode não ter sincronizado completamente');
        }
        
        // MELHORADO: Invalidar cache de endereços para garantir atualização na tela "Meus Endereços"
        console.log('[SmartCepModal] 🗂️ Invalidando cache de endereços...');
        await refetch();
        
        setIsUpdatingPrimary(false);
      }
      
      // Resolver zonas de entrega
      console.log('[SmartCepModal] 🎯 Resolvendo zonas de entrega para:', cep);
      await onCepChange(cep);
      
      // NOVO: Disparar evento para atualizar o marketplace automaticamente
      dispatchAddressChangeEvent(cep);
      
      toast({
        title: "✅ Endereço atualizado",
        description: addressId 
          ? `Endereço principal alterado para ${formatCep(cep)}` 
          : `Produtos atualizados para ${formatCep(cep)}`,
        duration: 3000
      });
      
      // Aguardar para garantir que tudo foi processado
      await new Promise(resolve => setTimeout(resolve, 800));
      
      onOpenChange(false);
      
    } catch (error) {
      console.error('[SmartCepModal] ❌ Erro ao alterar endereço:', error);
      
      let errorMessage = "Tente novamente em alguns instantes";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        variant: "destructive",
        title: "❌ Erro ao alterar endereço",
        description: errorMessage,
        duration: 4000
      });
    } finally {
      setIsChangingCep(false);
      setChangingAddressId(null);
      setIsUpdatingPrimary(false);
    }
  };

  // CORRIGIDO: Modificar para disparar evento também para CEPs temporários
  const handleTempCepSubmit = async (cep: string) => {
    console.log('[SmartCepModal] 📍 Processando CEP temporário:', cep);
    
    try {
      // Primeiro resolver as zonas
      await handleAddressSelect(cep);
      
      // NOVO: Garantir que o evento seja disparado para CEPs temporários também
      console.log('[SmartCepModal] 🚀 Disparando evento para CEP temporário:', cep);
      dispatchAddressChangeEvent(cep);
      
    } catch (error) {
      console.error('[SmartCepModal] ❌ Erro ao processar CEP temporário:', error);
      throw error;
    }
  };

  const handleAddAddress = () => {
    setShowAddAddressModal(true);
  };

  // CORRIGIDO: Função para salvar endereço de verdade
  const handleAddressAdded = async (savedAddress: any) => {
    console.log('[SmartCepModal] 💾 Salvando novo endereço:', savedAddress);
    
    try {
      // Usar o hook useAddresses para salvar
      await handleSaveAddress(savedAddress);
      
      console.log('[SmartCepModal] ✅ Endereço salvo com sucesso');
      
      // Atualizar a lista de endereços
      await refetch();
      
      // Fechar o modal de adicionar endereço
      setShowAddAddressModal(false);
      
      toast({
        title: "✅ Endereço adicionado",
        description: "Novo endereço cadastrado com sucesso!",
        duration: 3000
      });
      
      // Não fechar o modal principal automaticamente - deixar usuário escolher
      
    } catch (error) {
      console.error('[SmartCepModal] ❌ Erro ao salvar endereço:', error);
      
      toast({
        variant: "destructive",
        title: "❌ Erro ao salvar endereço",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        duration: 4000
      });
    }
  };

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
  
  return (
    <>
      <CustomModal
        open={open}
        onOpenChange={onOpenChange}
        title={!isAuthenticated ? "Definir CEP de Entrega" : hasAddresses ? "Selecionar Endereço de Entrega" : "Cadastre seu primeiro endereço"}
        description={!isAuthenticated ? "Digite seu CEP para ver produtos disponíveis na sua região" : hasAddresses ? "Escolha um endereço ou digite um novo CEP" : "Para ver produtos disponíveis na sua região, cadastre um endereço de entrega"}
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

          {/* MELHORADO: Feedback específico para sincronização */}
          {isUpdatingPrimary && (
            <div className="flex items-center justify-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Sincronizando endereço principal...</span>
            </div>
          )}

          {isChangingCep && !isUpdatingPrimary && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Atualizando produtos...</span>
            </div>
          )}

          {hasAddresses ? (
            <>
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
                    {addresses.map((address) => {
                      const isChangingThis = changingAddressId === address.id;
                      const isCurrentPrimary = address.principal;
                      
                      return (
                        <button
                          key={address.id}
                          onClick={() => handleAddressSelect(address.cep, address.id)}
                          disabled={isChangingCep}
                          className={`w-full p-3 text-left border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            isCurrentPrimary 
                              ? 'bg-green-50 border-green-200 hover:border-green-300' 
                              : 'bg-white border-gray-200 hover:border-construPro-blue hover:bg-blue-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900">{address.nome}</span>
                                {address.principal && (
                                  <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
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
                            {isChangingThis ? (
                              <div className="flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                              </div>
                            ) : isChangingCep ? (
                              <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </button>
                      );
                    })}
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
            </>
          ) : (
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
              
              <div className="border-t pt-4 mt-6">
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
          )}
        </div>
      </CustomModal>

      <AddAddressModal
        open={showAddAddressModal}
        onOpenChange={setShowAddAddressModal}
        onSave={handleAddressAdded}
      />
    </>
  );
};

export default SmartCepModal;
