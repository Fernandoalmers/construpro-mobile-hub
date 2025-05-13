
import React from 'react';
import { CheckCircle } from 'lucide-react';
import Card from '@/components/common/Card';
import CustomButton from '@/components/common/CustomButton';

interface Store {
  id: string;
  items: any[];
}

interface OrderSummarySectionProps {
  storeGroups: Store[];
  subtotal: number;
  shipping: number;
  total: number;
  totalPoints: number;
  isSubmitting: boolean;
  onPlaceOrder: () => void;
  onGoBack: () => void;
}

const OrderSummarySection: React.FC<OrderSummarySectionProps> = ({
  storeGroups,
  subtotal,
  shipping,
  total,
  totalPoints,
  isSubmitting,
  onPlaceOrder,
  onGoBack
}) => {
  return (
    <div>
      <h2 className="font-bold mb-3">Resumo do Pedido</h2>
      <Card className="p-4">
        <div className="space-y-3 mb-4">
          {/* Per store summary */}
          {storeGroups.map((store, index) => (
            <div key={store.id} className="border-b border-gray-100 pb-3 mb-3">
              <div className="flex items-center mb-2">
                <span className="font-medium text-sm">Loja {index + 1}</span>
              </div>
              <div className="pl-7 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal ({store.items.length} {store.items.length === 1 ? 'item' : 'itens'})</span>
                  <span>R$ {store.items.reduce((sum, item) => sum + (item.subtotal || 0), 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Frete</span>
                  <span>Grátis</span>
                </div>
              </div>
            </div>
          ))}
          
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span>R$ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Frete</span>
            <span>Grátis</span>
          </div>
          <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between font-bold">
            <span>Total</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-construPro-orange text-sm">
            <span>Pontos a ganhar</span>
            <span>{totalPoints} pontos</span>
          </div>
        </div>
        
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
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processando..." : "Finalizar Pedido"}
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
