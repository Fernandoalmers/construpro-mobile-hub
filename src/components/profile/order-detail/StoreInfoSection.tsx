
import React from 'react';
import { Store, Phone, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { VendorInfo } from '@/services/order/types';

interface StoreInfoSectionProps {
  vendor: VendorInfo;
  itemCount: number;
  subtotal: number;
  shippingCost?: number;
}

const StoreInfoSection: React.FC<StoreInfoSectionProps> = ({
  vendor,
  itemCount,
  subtotal,
  shippingCost = 0
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card className="p-4 mb-3">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {vendor.logo ? (
            <img 
              src={vendor.logo} 
              alt={`Logo ${vendor.nome_loja}`}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
              <Store size={24} className="text-gray-400" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-lg text-gray-900">{vendor.nome_loja}</h3>
            <p className="text-sm text-gray-500">
              {itemCount} {itemCount === 1 ? 'item' : 'itens'}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-600">Subtotal</div>
          <div className="font-semibold text-lg">{formatCurrency(subtotal)}</div>
          {shippingCost > 0 && (
            <div className="text-sm text-gray-500">+ {formatCurrency(shippingCost)} frete</div>
          )}
        </div>
      </div>

      {vendor.telefone && (
        <div className="border-t pt-3 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone size={16} />
            <span>{vendor.telefone}</span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default StoreInfoSection;
