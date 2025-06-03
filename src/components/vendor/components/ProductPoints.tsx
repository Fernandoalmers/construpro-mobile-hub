
import React from 'react';

interface ProductPointsProps {
  formData: any;
  onInputChange: (field: string, value: any) => void;
}

const ProductPoints: React.FC<ProductPointsProps> = ({
  formData,
  onInputChange
}) => {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Pontos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Pontos para consumidor</label>
          <input
            type="number"
            min="0"
            value={formData.pontos_consumidor}
            onChange={(e) => onInputChange('pontos_consumidor', parseInt(e.target.value) || 0)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Pontos para profissional</label>
          <input
            type="number"
            min="0"
            value={formData.pontos_profissional}
            onChange={(e) => onInputChange('pontos_profissional', parseInt(e.target.value) || 0)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="0"
          />
        </div>
      </div>
      <p className="text-sm text-gray-500 mt-2">
        A pontuação é concedida com base no perfil do cliente. Consumidores e profissionais ganham pontos diferentes que podem ser resgatados posteriormente.
      </p>
    </div>
  );
};

export default ProductPoints;
