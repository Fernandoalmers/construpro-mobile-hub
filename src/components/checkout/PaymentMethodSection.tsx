
import React from 'react';
import { CreditCard, Banknote, Coins } from 'lucide-react';
import Card from '@/components/common/Card';
import { PaymentMethod } from '@/hooks/checkout/use-checkout';
import { cn } from '@/lib/utils';

interface PaymentMethodSectionProps {
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  changeAmount: string;
  onChangeAmountChange: (amount: string) => void;
}

const PaymentMethodSection: React.FC<PaymentMethodSectionProps> = ({
  paymentMethod,
  onPaymentMethodChange,
  changeAmount,
  onChangeAmountChange
}) => {
  return (
    <div>
      <h2 className="font-bold mb-3">Forma de Pagamento</h2>
      <Card className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            type="button"
            onClick={() => onPaymentMethodChange('credit')}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-md border",
              paymentMethod === 'credit' 
                ? "border-construPro-blue bg-blue-50" 
                : "border-gray-200 bg-white"
            )}
          >
            <CreditCard className={cn(
              "mb-2",
              paymentMethod === 'credit' ? "text-construPro-blue" : "text-gray-500"
            )} />
            <span className={cn(
              "font-medium",
              paymentMethod === 'credit' ? "text-construPro-blue" : "text-gray-700"
            )}>Cartão de Crédito</span>
          </button>
          
          <button
            type="button"
            onClick={() => onPaymentMethodChange('debit')}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-md border",
              paymentMethod === 'debit' 
                ? "border-construPro-blue bg-blue-50" 
                : "border-gray-200 bg-white"
            )}
          >
            <CreditCard className={cn(
              "mb-2",
              paymentMethod === 'debit' ? "text-construPro-blue" : "text-gray-500"
            )} />
            <span className={cn(
              "font-medium",
              paymentMethod === 'debit' ? "text-construPro-blue" : "text-gray-700"
            )}>Cartão de Débito</span>
          </button>
          
          <button
            type="button"
            onClick={() => onPaymentMethodChange('money')}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-md border",
              paymentMethod === 'money' 
                ? "border-construPro-blue bg-blue-50" 
                : "border-gray-200 bg-white"
            )}
          >
            <Banknote className={cn(
              "mb-2",
              paymentMethod === 'money' ? "text-construPro-blue" : "text-gray-500"
            )} />
            <span className={cn(
              "font-medium",
              paymentMethod === 'money' ? "text-construPro-blue" : "text-gray-700"
            )}>Dinheiro</span>
          </button>
          
          <button
            type="button"
            onClick={() => onPaymentMethodChange('pix')}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-md border",
              paymentMethod === 'pix' 
                ? "border-construPro-blue bg-blue-50" 
                : "border-gray-200 bg-white"
            )}
          >
            <Coins className={cn(
              "mb-2",
              paymentMethod === 'pix' ? "text-construPro-blue" : "text-gray-500"
            )} />
            <span className={cn(
              "font-medium",
              paymentMethod === 'pix' ? "text-construPro-blue" : "text-gray-700"
            )}>PIX</span>
          </button>
        </div>
        
        {paymentMethod === 'money' && (
          <div>
            <label className="block text-sm text-gray-600 mb-1">Precisa de troco para quanto?</label>
            <input
              type="text"
              value={changeAmount}
              onChange={(e) => onChangeAmountChange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Ex: 50,00"
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default PaymentMethodSection;
