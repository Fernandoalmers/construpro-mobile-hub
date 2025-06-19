
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, AlertCircle, CheckCircle, MapPin, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Product } from '@/services/productService';
import { getPromotionInfo } from '@/utils/promotionUtils';
import { getProductDeliveryInfo, getStoreLocationInfo } from '@/utils/delivery';
import { useAuth } from '@/context/AuthContext';
import OfferCountdown from '@/components/common/OfferCountdown';
import QuickAddressModal from './QuickAddressModal';
import TempCepInput from './TempCepInput';
import { useTempCep } from '@/hooks/useTempCep';
import { supabase } from '@/integrations/supabase/client';

interface ProductInfoProps {
  produto: Product;
  deliveryEstimate: {
    minDays: number;
    maxDays: number;
  };
}

const ProductInfo: React.FC<ProductInfoProps> = ({ produto, deliveryEstimate }) => {
  const { profile, isAuthenticated, refreshProfile } = useAuth();
  const { tempCep, isLoading: tempCepLoading, setIsLoading: setTempCepLoading, setTemporaryCep } = useTempCep();
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [currentUserCep, setCurrentUserCep] = useState<string | null>(null);
  const [deliveryInfo, setDeliveryInfo] = useState<{
    isLocal: boolean;
    message: string;
    estimatedTime?: string;
    deliveryFee?: number;
    loading: boolean;
  }>({
    isLocal: false,
    message: 'Calculando informações de entrega...',
    loading: true
  });

  // Use promotion utils for consistent promotion handling
  const promotionInfo = getPromotionInfo(produto);
  
  // Get correct prices
  const regularPrice = produto.preco_normal || produto.preco;
  const currentPrice = promotionInfo.hasActivePromotion ? promotionInfo.promotionalPrice! : promotionInfo.originalPrice;

  // Get product rating and review count
  const productRating = React.useMemo(() => 
    produto.avaliacao || 0
  , [produto.id, produto.avaliacao]);
  
  const reviewCount = React.useMemo(() => 
    produto.num_avaliacoes || 0
  , [produto.id, produto.num_avaliacoes]);

  // Enhanced function to get user's main address with better prioritization
  const getUserMainAddress = async () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [ProductInfo] Getting user main address for user:`, profile?.id);
    
    // Only proceed if user is authenticated
    if (!isAuthenticated || !profile?.id) {
      console.log(`[${timestamp}] [ProductInfo] User not authenticated or no profile ID`);
      return null;
    }

    try {
      // FIRST: Try to get main address directly from user_addresses table (most reliable)
      console.log(`[${timestamp}] [ProductInfo] Step 1: Fetching main address from user_addresses table`);
      
      const { data: mainAddress, error: mainError } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', profile.id)
        .eq('principal', true)
        .maybeSingle();

      if (!mainError && mainAddress && mainAddress.cep) {
        console.log(`[${timestamp}] [ProductInfo] ✅ Found main address from user_addresses:`, {
          cep: mainAddress.cep,
          cidade: mainAddress.cidade,
          estado: mainAddress.estado
        });
        
        const addressData = {
          logradouro: mainAddress.logradouro,
          numero: mainAddress.numero,
          complemento: mainAddress.complemento,
          bairro: mainAddress.bairro,
          cidade: mainAddress.cidade,
          estado: mainAddress.estado,
          cep: mainAddress.cep
        };
        
        setCurrentUserCep(mainAddress.cep);
        return addressData;
      }

      // SECOND: If no main address, try to get first available address
      console.log(`[${timestamp}] [ProductInfo] Step 2: No main address found, trying first available address`);
      
      const { data: firstAddress, error: firstError } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!firstError && firstAddress && firstAddress.cep) {
        console.log(`[${timestamp}] [ProductInfo] ✅ Using first available address:`, {
          cep: firstAddress.cep,
          cidade: firstAddress.cidade,
          estado: firstAddress.estado
        });
        
        const addressData = {
          logradouro: firstAddress.logradouro,
          numero: firstAddress.numero,
          complemento: firstAddress.complemento,
          bairro: firstAddress.bairro,
          cidade: firstAddress.cidade,
          estado: firstAddress.estado,
          cep: firstAddress.cep
        };
        
        setCurrentUserCep(firstAddress.cep);
        return addressData;
      }

      // THIRD: Fallback to profile endereco_principal (less reliable)
      console.log(`[${timestamp}] [ProductInfo] Step 3: Fallback to profile endereco_principal`);
      
      if (profile?.endereco_principal && profile.endereco_principal.cep) {
        console.log(`[${timestamp}] [ProductInfo] ⚠️ Using profile endereco_principal as fallback:`, {
          cep: profile.endereco_principal.cep,
          cidade: profile.endereco_principal.cidade,
          estado: profile.endereco_principal.estado
        });
        
        setCurrentUserCep(profile.endereco_principal.cep);
        return profile.endereco_principal;
      }

      console.log(`[${timestamp}] [ProductInfo] ❌ No address found anywhere`);
      setCurrentUserCep(null);
      return null;

    } catch (error) {
      console.error(`[${timestamp}] [ProductInfo] Exception fetching user address:`, error);
      setCurrentUserCep(null);
      return null;
    }
  };

  // Enhanced delivery calculation with improved CEP handling
  const calculateDeliveryInfo = async (forceRecalculate = false) => {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [ProductInfo] 🚚 Starting delivery calculation for product:`, produto.id);
    console.log(`[${timestamp}] [ProductInfo] Product vendor ID:`, produto.vendedor_id);
    
    try {
      setDeliveryInfo(prev => ({ ...prev, loading: true }));

      // Get user's main address
      console.log(`[${timestamp}] [ProductInfo] Getting user main address...`);
      const userMainAddress = await getUserMainAddress();
      
      const addressTime = Date.now() - startTime;
      console.log(`[${timestamp}] [ProductInfo] User address lookup completed (${addressTime}ms)`);

      // Get store location info
      console.log(`[${timestamp}] [ProductInfo] Getting store location info...`);
      const storeLocationInfo = await getStoreLocationInfo(produto.stores?.id, produto.vendedor_id);
      
      const storeTime = Date.now() - startTime;
      console.log(`[${timestamp}] [ProductInfo] Store location info (${storeTime}ms):`, storeLocationInfo);

      // Determine which CEP to use (priority: temp > user registered > none)
      const customerCep = tempCep || userMainAddress?.cep;
      console.log(`[${timestamp}] [ProductInfo] 📍 CEP Selection:`, {
        tempCep,
        userCep: userMainAddress?.cep,
        finalCep: customerCep,
        source: tempCep ? 'temporary' : userMainAddress?.cep ? 'user_address' : 'none'
      });

      if (!customerCep) {
        console.log(`[${timestamp}] [ProductInfo] ❌ No CEP available for delivery calculation`);
        setDeliveryInfo({
          isLocal: false,
          message: 'Informe seu CEP para calcular o frete',
          loading: false
        });
        return;
      }

      // Use the enhanced delivery calculation
      console.log(`[${timestamp}] [ProductInfo] 🔄 Calling getProductDeliveryInfo with:`, {
        vendorId: produto.vendedor_id,
        productId: produto.id,
        customerCep,
        storeCep: storeLocationInfo?.cep,
        storeIbge: storeLocationInfo?.ibge
      });
      
      const info = await getProductDeliveryInfo(
        produto.vendedor_id,
        produto.id,
        customerCep,
        storeLocationInfo?.cep,
        storeLocationInfo?.ibge
      );
      
      const totalTime = Date.now() - startTime;
      console.log(`[${timestamp}] [ProductInfo] ✅ Delivery calculation result (${totalTime}ms):`, info);

      setDeliveryInfo({
        isLocal: info.isLocal,
        message: info.message,
        estimatedTime: info.estimatedTime,
        deliveryFee: info.deliveryFee,
        loading: false
      });

    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`[${timestamp}] [ProductInfo] ❌ Error calculating delivery info (${totalTime}ms):`, error);
      
      setDeliveryInfo({
        isLocal: false,
        message: 'Erro ao calcular informações de entrega',
        estimatedTime: undefined,
        loading: false
      });
    }
  };

  // Calculate delivery info when component mounts or dependencies change
  useEffect(() => {
    if (produto.vendedor_id) {
      calculateDeliveryInfo();
    } else {
      setDeliveryInfo({
        isLocal: false,
        message: 'Informações de entrega não disponíveis',
        loading: false
      });
    }
  }, [produto.vendedor_id, produto.id, profile?.endereco_principal, profile?.id, isAuthenticated, tempCep]);

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
    console.log('[ProductInfo] Address added, refreshing profile...');
    await refreshProfile();
    // Force recalculation after address is added
    setTimeout(() => {
      calculateDeliveryInfo(true);
    }, 1000);
  };

  // Clear temporary CEP
  const handleClearTempCep = () => {
    setTemporaryCep('');
    setTimeout(() => {
      calculateDeliveryInfo(true);
    }, 100);
  };

  // Debug log for promotion display
  console.log('[ProductInfo] Promotion display for', produto.nome, {
    hasActivePromotion: promotionInfo.hasActivePromotion,
    promotionalPrice: promotionInfo.promotionalPrice,
    originalPrice: promotionInfo.originalPrice,
    discountPercentage: promotionInfo.discountPercentage,
    promotionEndDate: promotionInfo.promotionEndDate
  });

  // Determine if CEP input should be shown
  const shouldShowCepInput = !isAuthenticated || (!currentUserCep && !profile?.endereco_principal);
  
  return (
    <div>
      <div className="flex items-center space-x-1 mb-2">
        {produto.categoria && (
          <Badge variant="outline" className="capitalize">
            {produto.categoria}
          </Badge>
        )}
        {produto.segmento && (
          <Badge variant="outline" className="bg-blue-50">
            {produto.segmento}
          </Badge>
        )}
        {produto.sku && (
          <span className="text-xs text-gray-500 ml-auto">
            SKU: {produto.sku}
          </span>
        )}
      </div>

      <h1 className="text-2xl font-bold mb-2">{produto.nome}</h1>
      
      {/* Store info */}
      {produto.stores && (
        <Link 
          to={`/loja/${produto.stores.id}`} 
          className="flex items-center mb-3 text-sm text-blue-600 hover:underline"
        >
          {produto.stores.logo_url && (
            <img 
              src={produto.stores.logo_url} 
              alt={produto.stores.nome_loja || 'Loja'} 
              className="w-5 h-5 rounded-full mr-1 object-cover" 
            />
          )}
          Vendido por {produto.stores.nome_loja || 'Loja'}
        </Link>
      )}
      
      {/* Rating */}
      <div className="flex items-center mb-4">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={16}
              className={`${
                star <= productRating
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-gray-500 ml-2">
          ({reviewCount} {reviewCount === 1 ? 'avaliação' : 'avaliações'})
        </span>
      </div>
      
      {/* Price section */}
      <div className="mb-4">
        {/* Promotion badges and countdown */}
        {promotionInfo.hasActivePromotion && (
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-red-500 hover:bg-red-600 text-xs">
              {promotionInfo.discountPercentage}% OFF
            </Badge>
            <OfferCountdown 
              endDate={promotionInfo.promotionEndDate}
              isActive={promotionInfo.hasActivePromotion}
              size="sm"
              variant="compact"
            />
          </div>
        )}
        
        {/* Price display */}
        <div className="flex items-baseline mb-2">
          {promotionInfo.hasActivePromotion && (
            <span className="text-gray-500 line-through mr-2">
              R$ {promotionInfo.originalPrice.toFixed(2)}
            </span>
          )}
          <span className="text-2xl font-bold text-green-700">
            R$ {currentPrice.toFixed(2)}
          </span>
        </div>
        
        <div className="text-sm text-gray-700 mt-1">
          {produto.estoque > 0 ? (
            <span className="text-green-700">Em estoque ({produto.estoque} {produto.estoque === 1 ? 'unidade disponível' : 'unidades disponíveis'})</span>
          ) : (
            <span className="text-red-500">Fora de estoque</span>
          )}
        </div>
        
        {/* Points information */}
        <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-100">
          <div className="text-sm">
            <span className="font-medium">Ganhe </span>
            <span className="text-blue-700 font-bold">
              {produto.pontos_consumidor || produto.pontos || 0} pontos
            </span>
            <span> na compra deste produto</span>
          </div>
          {(produto.pontos_profissional || 0) > 0 && (
            <div className="text-xs mt-1">
              <span className="font-medium">Profissionais ganham </span>
              <span className="text-blue-700 font-bold">
                {produto.pontos_profissional} pontos
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Enhanced shipping info with improved CEP handling */}
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
              {(currentUserCep || tempCep) && (
                <div className="flex items-center mb-2">
                  <MapPin className="w-4 h-4 text-blue-500 mr-2" />
                  <span className="text-xs text-gray-600">
                    {tempCep ? (
                      <>
                        CEP temporário: <strong>{tempCep.replace(/(\d{5})(\d{3})/, '$1-$2')}</strong>
                        <button 
                          onClick={handleClearTempCep}
                          className="ml-2 text-blue-600 hover:underline"
                        >
                          (usar meu endereço)
                        </button>
                      </>
                    ) : currentUserCep ? (
                      <>
                        Meu endereço: <strong>{currentUserCep.replace(/(\d{5})(\d{3})/, '$1-$2')}</strong>
                      </>
                    ) : (
                      'Endereço carregado'
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
              
              {/* CEP input - only show if user has no address */}
              {shouldShowCepInput && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">
                    {isAuthenticated ? 'Consulte o frete para seu CEP:' : 'Faça login ou consulte o frete:'}
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
                  {!currentUserCep && !profile?.endereco_principal && (
                    <Button
                      onClick={() => setShowAddressModal(true)}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      <Plus className="w-4 h-4" />
                      Cadastrar Endereço
                    </Button>
                  )}
                  
                  {(currentUserCep || profile?.endereco_principal) && !tempCep && (
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
              
              {/* Login suggestion for guests */}
              {!isAuthenticated && (
                <div className="text-xs text-blue-600 mt-2">
                  <Link to="/login" className="underline">
                    Faça login para salvar seu endereço
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Unit of measurement note */}
      {produto.unidade_medida && produto.unidade_medida !== 'unidade' && (
        <div className="text-xs bg-yellow-50 p-2 rounded-md border border-yellow-100 mb-4">
          <span className="font-bold">Nota: </span>
          <span>Este produto é vendido por {produto.unidade_medida.toLowerCase()}</span>
          {produto.unidade_medida.toLowerCase().includes('m²') && (
            <span className="block mt-1">As quantidades serão ajustadas automaticamente para múltiplos da unidade de venda.</span>
          )}
        </div>
      )}

      {/* Quick Address Modal */}
      <QuickAddressModal
        open={showAddressModal}
        onOpenChange={setShowAddressModal}
        onAddressAdded={handleAddressAdded}
      />
    </div>
  );
};

export default ProductInfo;
