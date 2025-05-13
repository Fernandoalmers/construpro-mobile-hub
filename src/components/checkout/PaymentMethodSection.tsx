
import React from 'react';
import { CreditCard, DollarSign, QrCode } from 'lucide-react';
import Card from '@/components/common/Card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PaymentMethod } from '@/hooks/checkout/use-checkout';

interface PaymentMethodSectionProps {
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (value: PaymentMethod) => void;
  changeAmount: string;
  onChangeAmountChange: (value: string) => void;
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
        <RadioGroup
          value={paymentMethod}
          onValueChange={(value) => onPaymentMethodChange(value as PaymentMethod)}
          className="space-y-4"
        >
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="money" id="money" />
            <Label htmlFor="money" className="flex items-center flex-1">
              <DollarSign size={18} className="mr-2 text-green-600" />
              Dinheiro
            </Label>
          </div>
        
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="credit" id="credit" />
            <Label htmlFor="credit" className="flex items-center flex-1">
              <CreditCard size={18} className="mr-2 text-construPro-blue" />
              Cartão de Crédito à vista
            </Label>
          </div>
          
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="debit" id="debit" />
            <Label htmlFor="debit" className="flex items-center flex-1">
              <CreditCard size={18} className="mr-2 text-construPro-blue" />
              Cartão de Débito
            </Label>
          </div>
          
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="pix" id="pix" />
            <Label htmlFor="pix" className="flex items-center flex-1">
              <QrCode size={18} className="mr-2 text-construPro-blue" />
              Pix
            </Label>
          </div>
        </RadioGroup>
        
        {/* Money change field */}
        {paymentMethod === 'money' && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <label htmlFor="changeAmount" className="block text-sm font-medium mb-2">
              Troco para quanto?
            </label>
            <Input
              id="changeAmount"
              type="number"
              value={changeAmount}
              onChange={(e) => onChangeAmountChange(e.target.value)}
              placeholder="R$ 0,00"
              className="max-w-xs"
            />
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            Pagamento será realizado diretamente ao vendedor no momento da entrega.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default PaymentMethodSection;
