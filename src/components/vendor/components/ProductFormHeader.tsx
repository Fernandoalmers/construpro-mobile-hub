
import React from 'react';
import { ArrowLeft, Save } from 'lucide-react';

interface ProductFormHeaderProps {
  isEditing: boolean;
  onBack: () => void;
  onSave: () => void;
  loading: boolean;
}

const ProductFormHeader: React.FC<ProductFormHeaderProps> = ({
  isEditing,
  onBack,
  onSave,
  loading
}) => {
  return (
    <div className="bg-white p-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center">
        <button onClick={onBack} className="mr-4">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">
          {isEditing ? 'Editar Produto' : 'Novo Produto'}
        </h1>
      </div>
      <button
        onClick={onSave}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
      >
        <Save size={16} />
        {loading ? 'Salvando...' : 'Salvar'}
      </button>
    </div>
  );
};

export default ProductFormHeader;
