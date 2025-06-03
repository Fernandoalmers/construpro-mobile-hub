
import React from 'react';
import ProductSegmentSelect from '../ProductSegmentSelect';
import ProductCategorySelect from '../ProductCategorySelect';

interface ProductBasicInformationProps {
  formData: any;
  currentSegmentId: string;
  onInputChange: (field: string, value: any) => void;
  onSegmentNameChange: (segmentName: string) => void;
  onSegmentIdChange: (segmentId: string) => void;
  onCategoryChange: (categoryName: string) => void;
}

const ProductBasicInformation: React.FC<ProductBasicInformationProps> = ({
  formData,
  currentSegmentId,
  onInputChange,
  onSegmentNameChange,
  onSegmentIdChange,
  onCategoryChange
}) => {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Informações Básicas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Nome do Produto *</label>
          <input
            type="text"
            value={formData.nome}
            onChange={(e) => onInputChange('nome', e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Digite o nome do produto"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Categoria *</label>
          <ProductCategorySelect
            value={formData.categoria}
            onChange={onCategoryChange}
            segmentId={currentSegmentId}
            required={true}
          />
        </div>
      </div>
      
      <div className="mt-4">
        <label className="block text-sm font-medium mb-2">Descrição</label>
        <textarea
          value={formData.descricao}
          onChange={(e) => onInputChange('descricao', e.target.value)}
          className="w-full border rounded-lg px-3 py-2 h-24"
          placeholder="Descrição detalhada do produto"
        />
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium mb-2">Segmento</label>
        <ProductSegmentSelect
          value={formData.segmento}
          onChange={onSegmentNameChange}
          onSegmentIdChange={onSegmentIdChange}
          initialSegmentId={currentSegmentId}
        />
      </div>
    </div>
  );
};

export default ProductBasicInformation;
