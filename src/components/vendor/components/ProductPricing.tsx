
import React from 'react';

interface ProductPricingProps {
  formData: any;
  onInputChange: (field: string, value: any) => void;
}

const ProductPricing: React.FC<ProductPricingProps> = ({
  formData,
  onInputChange
}) => {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Estoque e Preço</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Preço por unidade *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.preco_normal}
            onChange={(e) => onInputChange('preco_normal', parseFloat(e.target.value) || 0)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Preço promocional</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.preco_promocional || ''}
            onChange={(e) => onInputChange('preco_promocional', e.target.value ? parseFloat(e.target.value) : null)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Estoque disponível *</label>
          <input
            type="number"
            min="0"
            value={formData.estoque}
            onChange={(e) => onInputChange('estoque', parseInt(e.target.value) || 0)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="0"
          />
        </div>
      </div>
    </div>
  );
};

export default ProductPricing;
