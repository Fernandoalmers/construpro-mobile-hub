import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, AlertCircle, CheckCircle, MapPin, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Product } from '@/services/productService';
import { getPromotionInfo } from '@/utils/promotionUtils';
import { getProductDeliveryInfo, getStoreLocationInfo } from '@/utils/deliveryUtils';
import { useAuth } from '@/context/AuthContext';
import OfferCountdown from '@/components/common/OfferCountdown';
import QuickAddressModal from './QuickAddressModal';
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
  const [showAddressModal, setShowAddressModal] = useState(false);
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

  // Function to get user's main address with enhanced fallback
  const getUserMainAddress = async () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [ProductInfo] Getting user main address...`);
    console.log(`[${timestamp}] [ProductInfo] Profile endereco_principal:`, profile?.endereco_principal);
    
    // First try to use profile's main address
    if (profile?.endereco_principal && profile.endereco_principal.cep) {
      console.log(`[${timestamp}] [ProductInfo] Using profile endereco_principal:`, profile.endereco_principal);
      return profile.endereco_principal;
    }
    
    // Enhanced fallback: get main address directly from user_addresses table
    if (isAuthenticated && profile?.id) {
      try {
        console.log(`[${timestamp}] [ProductInfo] Fallback: fetching from user_addresses table`);
        
        // First try to get the main address
        const { data: mainAddress, error } = await supabase
          .from('user_addresses')
          .select('*')
          .eq('user_id', profile.id)
          .eq('principal', true)
          .single();

        if (!error && mainAddress) {
          console.log(`[${timestamp}] [ProductInfo] Found main address from user_addresses:`, mainAddress);
          return {
            logradouro: mainAddress.logradouro,
            numero: mainAddress.numero,
            complemento: mainAddress.complemento,
            bairro: mainAddress.bairro,
            cidade: mainAddress.cidade,
            estado: mainAddress.estado,
            cep: mainAddress.cep
          };
        }

        console.log(`[${timestamp}] [ProductInfo] No main address found, trying first available address`);
        
        // If no main address, try to get the first available address
        const { data: firstAddress, error: firstError } = await supabase
          .from('user_addresses')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        if (!firstError && firstAddress) {
          console.log(`[${timestamp}] [ProductInfo] Using first available address:`, firstAddress);
          return {
            logradouro: firstAddress.logradouro,
            numero: firstAddress.numero,
            complemento: firstAddress.complemento,
            bairro: firstAddress.bairro,
            cidade: firstAddress.cidade,
            estado: firstAddress.estado,
            cep: firstAddress.cep
          };
        }

      } catch (error) {
        console.error(`[${timestamp}] [ProductInfo] Exception fetching user address:`, error);
      }
    }
    
    console.log(`[${timestamp}] [ProductInfo] No address found`);
    return null;
  };

  // Calculate delivery info with enhanced error handling and timeouts
  useEffect(() => {
    const calculateDeliveryInfo = async () => {
      const startTime = Date.now();
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [ProductInfo] Starting delivery calculation for product:`, produto.id);
      console.log(`[${timestamp}] [ProductInfo] Product vendor ID:`, produto.vendedor_id);
      
      try {
        setDeliveryInfo(prev => ({ ...prev, loading: true }));

        // Get user's main address with timeout
        console.log(`[${timestamp}] [ProductInfo] Getting user main address...`);
        const addressPromise = getUserMainAddress();
        const userMainAddress = await Promise.race([
          addressPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Address lookup timeout')), 5000)
          )
        ]) as any;

        const addressTime = Date.now() - startTime;
        console.log(`[${timestamp}] [ProductInfo] User main address result (${addressTime}ms):`, userMainAddress);

        // Get store location info with timeout
        console.log(`[${timestamp}] [ProductInfo] Getting store location info...`);
        const storePromise = getStoreLocationInfo(produto.stores?.id, produto.vendedor_id);
        const storeLocationInfo = await Promise.race([
          storePromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Store info timeout')), 5000)
          )
        ]) as any;

        const storeTime = Date.now() - startTime;
        console.log(`[${timestamp}] [ProductInfo] Store location info (${storeTime}ms):`, storeLocationInfo);

        // Extract customer CEP
        const customerCep = userMainAddress?.cep;
        console.log(`[${timestamp}] [ProductInfo] Customer CEP:`, customerCep);

        if (!customerCep) {
          console.log(`[${timestamp}] [ProductInfo] No customer CEP available`);
          setDeliveryInfo({
            isLocal: false,
            message: 'Adicione seu endereço para ver informações de entrega',
            loading: false
          });
          return;
        }

        // Use the delivery calculation with enhanced error handling
        console.log(`[${timestamp}] [ProductInfo] Calling getProductDeliveryInfo with:`, {
          vendorId: produto.vendedor_id,
          productId: produto.id,
          customerCep,
          storeCep: storeLocationInfo?.cep,
          storeIbge: storeLocationInfo?.ibge
        });
        
        // Add overall timeout for the entire delivery calculation
        const deliveryPromise = getProductDeliveryInfo(
          produto.vendedor_id,
          produto.id,
          customerCep,
          storeLocationInfo?.cep,
          storeLocationInfo?.ibge
        );
        
        const info = await Promise.race([
          deliveryPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Delivery calculation timeout')), 15000)
          )
        ]) as any;
        
        const totalTime = Date.now() - startTime;
        console.log(`[${timestamp}] [ProductInfo] Delivery calculation result (${totalTime}ms):`, info);

        setDeliveryInfo({
          isLocal: info.isLocal,
          message: info.message,
          estimatedTime: info.estimatedTime,
          deliveryFee: info.deliveryFee,
          loading: false
        });

      } catch (error) {
        const totalTime = Date.now() - startTime;
        console.error(`[${timestamp}] [ProductInfo] Error calculating delivery info (${totalTime}ms):`, error);
        
        // Fallback to generic message instead of staying in loading state
        setDeliveryInfo({
          isLocal: false,
          message: 'Frete a combinar (informado após o fechamento do pedido)',
          loading: false
        });
      }
    };

    if (produto.vendedor_id) {
      calculateDeliveryInfo();
    } else {
      // If no vendor ID, set fallback immediately
      setDeliveryInfo({
        isLocal: false,
        message: 'Informações de entrega não disponíveis',
        loading: false
      });
    }
  }, [produto.vendedor_id, produto.id, profile?.endereco_principal, profile?.id, isAuthenticated]);

  const handleAddressAdded = async () => {
    console.log('[ProductInfo] Address added, refreshing profile...');
    await refreshProfile();
    // Force recalculation after address is added
    setTimeout(() => {
      const event = new Event('addressUpdated');
      window.dispatchEvent(event);
    }, 1000);
  };

  // Debug log for promotion display
  console.log('[ProductInfo] Promotion display for', produto.nome, {
    hasActivePromotion: promotionInfo.hasActivePromotion,
    promotionalPrice: promotionInfo.promotionalPrice,
    originalPrice: promotionInfo.originalPrice,
    discountPercentage: promotionInfo.discountPercentage,
    promotionEndDate: promotionInfo.promotionEndDate
  });

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
      
      {/* Shipping info - ENHANCED WITH ROBUST ERROR HANDLING AND TIMEOUTS */}
      <div className="p-3 bg-gray-50 rounded-md border border-gray-200 mb-4">
        <p className="text-sm text-gray-600 flex items-center mb-2">
          <Clock className="h-4 w-4 mr-2 text-green-600" />
          <span className="font-medium">Informações de entrega</span>
        </p>
        
        <div className="text-sm text-gray-700 ml-6">
          {deliveryInfo.loading ? (
            <div className="flex items-center">
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mr-2"></div>
              <span>Calculando frete...</span>
            </div>
          ) : isAuthenticated ? (
            <>
              {profile?.endereco_principal || deliveryInfo.message !== 'Adicione seu endereço para ver informações de entrega' ? (
                <>
                  <div className="flex items-center mb-2">
                    <MapPin className="w-4 h-4 text-blue-500 mr-2" />
                    <span className="text-xs text-gray-600">
                      {profile?.endereco_principal ? (
                        `${profile.endereco_principal.cidade} - ${profile.endereco_principal.estado}${profile.endereco_principal.cep ? ` (CEP: ${profile.endereco_principal.cep})` : ''}`
                      ) : (
                        'Endereço carregado'
                      )}
                    </span>
                  </div>
                  
                  {deliveryInfo.isLocal ? (
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span>
                        <strong>{deliveryInfo.message}</strong>
                        {deliveryInfo.estimatedTime && ` - ${deliveryInfo.estimatedTime}`}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <AlertCircle className="w-4 h-4 text-gray-500 mr-2" />
                      <span>{deliveryInfo.message}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center">
                    <AlertCircle className="w-4 h-4 text-gray-500 mr-2" />
                    <span>Adicione seu endereço para ver informações de entrega</span>
                  </div>
                  
                  <Button
                    onClick={() => setShowAddressModal(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    <Plus className="w-4 h-4" />
                    Cadastrar Endereço
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-gray-500 mr-2" />
                <span>Faça login para ver informações de entrega</span>
              </div>
              
              <div className="text-xs text-blue-600">
                <Link to="/login" className="underline">
                  Faça login para ver opções de entrega
                </Link>
              </div>
            </div>
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
