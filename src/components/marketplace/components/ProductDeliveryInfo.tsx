
import React, { useState } from 'react';
import { Clock, AlertCircle, CheckCircle, MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@/services/productService';
import { useAuth } from '@/context/AuthContext';
import { useTempCep } from '@/hooks/useTempCep';
import { useProductDelivery } from '@/hooks/useProductDelivery';
import TempCepInput from './TempCepInput';
import QuickAddressModal from './QuickAddressModal';

interface ProductDeliveryInfoProps {
  produto: Product;
}

const ProductDeliveryInfo: React.FC<ProductDeliveryInfoProps> = ({ produto }) => {
  const { profile, isAuthenticated, refreshProfile } = useAuth();
  const { tempCep, isLoading: tempCepLoading, setIsLoading: setTempCepLoading, setTemporaryCep, clearTemporaryCep } = useTempCep();
  const { deliveryInfo, calculateDeliveryInfo, currentUserCep } = useProductDelivery(produto);
  const [showAddressModal, setShowAddressModal] = useState(false);

  // Handle temporary CEP submission
  const handleTempCepSubmit = async (cep: string) => {
    setTempCepLoading(true);
    setTemporaryCep(cep);
    
    // Wait a bit for the tempCep state to update, then recalculate
    setTimeout(() => {
      calculateDeliveryInfo(true);
      setTempCepLoading(false);
    }, 100);
  };

  const handleAddressAdded = async () => {
    console.log('[ProductDeliveryInfo] Address added, refreshing profile...');
    await refreshProfile();
    // Force recalculation after address is added
    setTimeout(() => {
      calculateDeliveryInfo(true);
    }, 1000);
  };

  // CORRIGIDO: Clear temporary CEP and use registered address
  const handleUseMyAddress = () => {
    console.log('[ProductDeliveryInfo] Switching to registered address');
    clearTemporaryCep();
    setTimeout(() => {
      calculateDeliveryInfo(true);
    }, 100);
  };

  // Enhanced logic to determine if user has any address
  const hasUserAddress = profile?.endereco_principal?.cep || currentUserCep;
  
  // CORRIGIDO: Determinar qual CEP está sendo usado e qual mostrar
  const registeredCep = profile?.endereco_principal?.cep || currentUserCep;
  const activeCep = isAuthenticated && hasUserAddress && !tempCep ? registeredCep : tempCep;
  const isUsingRegisteredAddress = isAuthenticated && hasUserAddress && !tempCep;
  
  // Show CEP input para usuários sem endereço OU quando quiserem consultar outro CEP
  const shouldShowCepInput = !hasUserAddress && !tempCep;
  
  console.log('[ProductDeliveryInfo] Address debug:', {
    isAuthenticated,
    hasUserAddress,
    profileCep: profile?.endereco_principal?.cep,
    currentUserCep,
    tempCep,
    activeCep,
    isUsingRegisteredAddress,
    shouldShowCepInput
  });
  
  return (
    <div className="p-3 bg-gray-50 rounded-md border border-gray-200 mb-4">
      <p className="text-sm text-gray-600 flex items-center mb-2">
        <Clock className="h-4 w-4 mr-2 text-green-600" />
        <span className="font-medium">Informações de entrega</span>
      </p>
      
      <div className="text-sm text-gray-700 ml-6">
        {deliveryInfo.loading || tempCepLoading ? (
          <div className="flex items-center">
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mr-2"></div>
            <span>Calculando frete...</span>
          </div>
        ) : (
          <>
            {/* Show current address/CEP being used */}
            {activeCep && (
              <div className="flex items-center mb-2">
                <MapPin className="w-4 h-4 text-blue-500 mr-2" />
                <span className="text-xs text-gray-600">
                  {isUsingRegisteredAddress ? (
                    <>
                      Meu endereço: <strong>{activeCep.replace(/(\d{5})(\d{3})/, '$1-$2')}</strong>
                    </>
                  ) : (
                    <>
                      CEP temporário: <strong>{activeCep.replace(/(\d{5})(\d{3})/, '$1-$2')}</strong>
                      {hasUserAddress && (
                        <button 
                          onClick={handleUseMyAddress}
                          className="ml-2 text-blue-600 hover:underline"
                        >
                          (usar meu endereço)
                        </button>
                      )}
                    </>
                  )}
                </span>
              </div>
            )}
            
            {/* Delivery info */}
            <div className="flex items-center mb-3">
              {deliveryInfo.isLocal ? (
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              ) : (
                <AlertCircle className="w-4 h-4 text-gray-500 mr-2" />
              )}
              <span>
                <strong>{deliveryInfo.message}</strong>
                {deliveryInfo.estimatedTime && ` - ${deliveryInfo.estimatedTime}`}
              </span>
            </div>
            
            {/* CEP input - only show if user has NO address */}
            {shouldShowCepInput && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">
                  {isAuthenticated ? 'Cadastre seu endereço ou consulte o frete:' : 'Faça login ou consulte o frete:'}
                </p>
                <TempCepInput 
                  onCepSubmit={handleTempCepSubmit}
                  loading={tempCepLoading}
                />
              </div>
            )}
            
            {/* Options for authenticated users */}
            {isAuthenticated && (
              <div className="flex flex-col gap-2 mt-2">
                {!hasUserAddress && (
                  <Button
                    onClick={() => setShowAddressModal(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    <Plus className="w-4 h-4" />
                    Cadastrar Endereço
                  </Button>
                )}
                
                {hasUserAddress && isUsingRegisteredAddress && (
                  <div className="text-xs text-gray-600">
                    <p className="mb-1">Quer consultar para outro CEP?</p>
                    <TempCepInput 
                      onCepSubmit={handleTempCepSubmit}
                      loading={tempCepLoading}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Address Modal */}
      <QuickAddressModal
        open={showAddressModal}
        onOpenChange={setShowAddressModal}
        onAddressAdded={handleAddressAdded}
      />
    </div>
  );
};

export default ProductDeliveryInfo;
