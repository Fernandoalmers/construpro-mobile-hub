
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
  
  // DEBUGGING: Add detailed logs to track payment method selection
  const handlePaymentMethodClick = (method: PaymentMethod, e: React.MouseEvent) => {
    console.log('🔍 [PaymentMethodSection] Payment method button clicked:', {
      method,
      currentMethod: paymentMethod,
      event: e.type,
      target: e.target,
      timestamp: new Date().toISOString()
    });
    
    // PROTECTION: Prevent any potential form submission
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔍 [PaymentMethodSection] About to call onPaymentMethodChange with:', method);
    
    // Call the payment method change handler
    onPaymentMethodChange(method);
    
    console.log('🔍 [PaymentMethodSection] Payment method change completed');
  };

  // DEBUGGING: Track change amount input
  const handleChangeAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🔍 [PaymentMethodSection] Change amount input changed:', {
      value: e.target.value,
      timestamp: new Date().toISOString()
    });
    
    onChangeAmountChange(e.target.value);
  };

  return (
    <div>
      <h2 className="font-bold mb-3">Forma de pagamento na entrega?</h2>
      <Card className="p-4">
        {/* PROTECTION: Wrap in div instead of form to prevent accidental submission */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            type="button"
            onClick={(e) => handlePaymentMethodClick('credit', e)}
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
            )}>Cartão de Credito 1x</span>
          </button>
          
          <button
            type="button"
            onClick={(e) => handlePaymentMethodClick('debit', e)}
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
            onClick={(e) => handlePaymentMethodClick('money', e)}
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
            onClick={(e) => handlePaymentMethodClick('pix', e)}
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
              onChange={handleChangeAmountChange}
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
