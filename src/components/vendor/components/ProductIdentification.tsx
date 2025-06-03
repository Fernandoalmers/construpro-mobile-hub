
import React from 'react';

interface ProductIdentificationProps {
  formData: any;
  onInputChange: (field: string, value: any) => void;
  formatBarcode: (value: string) => string;
  validateBarcode: (barcode: string) => boolean;
}

const ProductIdentification: React.FC<ProductIdentificationProps> = ({
  formData,
  onInputChange,
  formatBarcode,
  validateBarcode
}) => {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Identificação do Produto</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">SKU (Código do Produto)</label>
          <input
            type="text"
            value={formData.sku}
            onChange={(e) => onInputChange('sku', e.target.value.toUpperCase())}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Ex: PROD-001, ABC123"
            maxLength={50}
          />
          <p className="text-xs text-gray-500 mt-1">
            Código único para identificação interna do produto
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Código de Barras</label>
          <input
            type="text"
            value={formData.codigo_barras}
            onChange={(e) => onInputChange('codigo_barras', formatBarcode(e.target.value))}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Ex: 1234567890123"
            maxLength={14}
          />
          <p className="text-xs text-gray-500 mt-1">
            Código de barras EAN-8, EAN-13, UPC-12 ou EAN-14
          </p>
          {formData.codigo_barras && !validateBarcode(formData.codigo_barras) && (
            <p className="text-xs text-red-500 mt-1">
              Formato inválido. Use 8, 12, 13 ou 14 dígitos
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductIdentification;
