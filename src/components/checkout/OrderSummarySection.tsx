
import React from 'react';
import { CheckCircle, Tag, Truck, AlertTriangle } from 'lucide-react';
import Card from '@/components/common/Card';
import CustomButton from '@/components/common/CustomButton';
import { StoreGroup } from '@/hooks/cart/use-group-items-by-store';

interface StoreDeliveryInfo {
  storeId: string;
  storeName: string;
  isLocal: boolean;
  message: string;
  estimatedTime?: string;
  deliveryFee: number;
  hasRestrictions: boolean;
  deliveryAvailable: boolean;
  loading: boolean;
  error?: string;
}

interface OrderSummarySectionProps {
  storeGroups: StoreGroup[];
  subtotal: number;
  shipping: number;
  discount?: number;
  total: number;
  totalPoints: number;
  appliedCoupon?: {code: string, discount: number} | null;
  isSubmitting: boolean;
  storeDeliveries?: Record<string, StoreDeliveryInfo>;
  isCalculatingDelivery?: boolean;
  hasRestrictedItems?: boolean;
  onPlaceOrder: () => void;
  onGoBack: () => void;
}

const OrderSummarySection: React.FC<OrderSummarySectionProps> = ({
  storeGroups,
  subtotal,
  shipping,
  discount = 0,
  total,
  totalPoints,
  appliedCoupon,
  isSubmitting,
  storeDeliveries = {},
  isCalculatingDelivery = false,
  hasRestrictedItems = false,
  onPlaceOrder,
  onGoBack
}) => {
  return (
    <div>
      <h2 className="font-bold mb-3">Resumo do Pedido</h2>
      <Card className="p-4">
        <div className="space-y-3 mb-4">
          {/* Per store summary with delivery info */}
          {storeGroups.map((store, index) => {
            const storeDelivery = storeDeliveries[store.loja.id];
            const storeSubtotal = store.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
            
            return (
              <div key={index} className="border-b border-gray-100 pb-3 mb-3">
                <div className="flex items-center mb-2">
                  <span className="font-medium text-sm">{store.loja?.nome || `Loja ${index + 1}`}</span>
                </div>
                <div className="pl-7 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal ({store.items.length} {store.items.length === 1 ? 'item' : 'itens'})</span>
                    <span>R$ {storeSubtotal.toFixed(2)}</span>
                  </div>
                  
                  {/* Delivery info per store */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <Truck className="h-3 w-3 text-gray-500" />
                      <span className="text-gray-600">Frete</span>
                    </div>
                    <div className="text-right">
                      {isCalculatingDelivery || storeDelivery?.loading ? (
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 animate-spin rounded-full border border-blue-500 border-t-transparent"></div>
                          <span className="text-xs text-gray-500">Calculando...</span>
                        </div>
                      ) : storeDelivery ? (
                        <div>
                          <span className={`text-xs ${storeDelivery.isLocal ? 'text-green-600' : 'text-gray-700'}`}>
                            {storeDelivery.deliveryFee === 0 ? 'Grátis' : `R$ ${storeDelivery.deliveryFee.toFixed(2)}`}
                          </span>
                          {storeDelivery.estimatedTime && (
                            <div className="text-xs text-gray-500">{storeDelivery.estimatedTime}</div>
                          )}
                          {storeDelivery.hasRestrictions && (
                            <div className="flex items-center gap-1 text-xs text-orange-600">
                              <AlertTriangle className="h-3 w-3" />
                              <span>Com restrições</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">A calcular</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span>R$ {subtotal.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between">
            <div className="flex items-center gap-1">
              <Truck className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Frete Total</span>
            </div>
            <span className={shipping === 0 && !isCalculatingDelivery && !Object.values(storeDeliveries).some(d => d.loading) ? 'text-green-600' : ''}>
              {isCalculatingDelivery || Object.values(storeDeliveries).some(d => d.loading) ? (
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 animate-spin rounded-full border border-blue-500 border-t-transparent"></div>
                  <span className="text-sm">Calculando...</span>
                </div>
              ) : Object.values(storeDeliveries).some(d => !d.deliveryAvailable || d.error) || storeGroups.some(store => !storeDeliveries[store.loja.id]) ? (
                <span className="text-sm text-gray-500">A calcular</span>
              ) : shipping === 0 ? (
                'Grátis'
              ) : (
                `R$ ${shipping.toFixed(2)}`
              )}
            </span>
          </div>
          
          {/* Show discount if coupon is applied */}
          {appliedCoupon && discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                Desconto ({appliedCoupon.code})
              </span>
              <span>-R$ {discount.toFixed(2)}</span>
            </div>
          )}
          
          <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between font-bold">
            <span>Total</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between text-construPro-orange text-sm">
            <span>Pontos a ganhar</span>
            <span>{totalPoints} pontos</span>
          </div>
        </div>
        
        {/* Show restrictions warning */}
        {hasRestrictedItems && (
          <div className="bg-orange-50 p-3 rounded-md flex items-start gap-2 mb-4 border border-orange-200">
            <AlertTriangle className="text-orange-500 mt-0.5" size={16} />
            <div>
              <p className="font-medium text-orange-700">Atenção!</p>
              <p className="text-sm text-orange-600">
                Alguns produtos possuem restrições de entrega para o endereço selecionado.
              </p>
            </div>
          </div>
        )}
        
        {/* Show savings highlight if there's a discount */}
        {appliedCoupon && discount > 0 && (
          <div className="bg-green-50 p-3 rounded-md flex items-start gap-2 mb-4 border border-green-200">
            <Tag className="text-green-500 mt-0.5" size={16} />
            <div>
              <p className="font-medium text-green-700">Você economizou R$ {discount.toFixed(2)}!</p>
              <p className="text-sm text-green-600">
                Cupom {appliedCoupon.code} aplicado com sucesso.
              </p>
            </div>
          </div>
        )}
        
        <div className="bg-green-50 p-3 rounded-md flex items-start gap-2 mb-4">
          <CheckCircle size={20} className="text-green-500 mt-0.5" />
          <div>
            <p className="font-medium text-green-700">Seu pedido está qualificado para pontos!</p>
            <p className="text-sm text-green-600">
              Você ganhará {totalPoints} pontos quando o pedido for entregue.
            </p>
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          <CustomButton 
            variant="primary" 
            fullWidth
            onClick={onPlaceOrder}
            disabled={isSubmitting || isCalculatingDelivery}
          >
            {isSubmitting ? "Processando..." : isCalculatingDelivery ? "Calculando frete..." : "Finalizar Pedido"}
          </CustomButton>
          
          <CustomButton 
            variant="outline" 
            fullWidth
            onClick={onGoBack}
            disabled={isSubmitting}
          >
            Voltar
          </CustomButton>
        </div>
      </Card>
    </div>
  );
};

export default OrderSummarySection;
