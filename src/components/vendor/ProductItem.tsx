
import React from 'react';
import { Card } from '@/components/ui/card';
import { Edit2, Trash2, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import ProductStatusBadge from './ProductStatusBadge';
import { VendorProduct } from '@/services/vendorService';

interface ProductItemProps {
  produto: VendorProduct;
  onToggleStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

const ProductItem: React.FC<ProductItemProps> = ({ 
  produto, 
  onToggleStatus,
  onDelete,
  onEdit
}) => {
  const isActive = produto.status === 'aprovado';
  
  const firstImageUrl = produto.imagens && Array.isArray(produto.imagens) && produto.imagens.length > 0
    ? produto.imagens[0]
    : undefined;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex">
        <div 
          className="w-20 h-20 bg-gray-200 rounded-md mr-4 flex-shrink-0 bg-center bg-cover"
          style={{ backgroundImage: firstImageUrl ? `url(${firstImageUrl})` : 'none' }}
        >
          {!firstImageUrl && (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Eye size={24} />
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold">{produto.nome}</h3>
              <p className="text-sm text-gray-600 line-clamp-1">{produto.descricao}</p>
            </div>
            
            <div className="flex">
              <button
                onClick={() => onEdit(produto.id)}
                className="p-2 mr-2 text-blue-600 hover:bg-blue-50 rounded"
                title="Editar produto"
              >
                <Edit2 size={18} />
              </button>
              
              <button
                onClick={() => onToggleStatus(produto.id, produto.status)}
                className={`p-2 mr-2 ${isActive ? 'text-amber-500' : 'text-green-600'} hover:bg-gray-50 rounded`}
                title={isActive ? "Desativar produto" : "Ativar produto"}
              >
                {isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              </button>
              
              <button
                onClick={() => onDelete(produto.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
                title="Excluir produto"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
          
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <div className="bg-gray-100 px-2 py-1 rounded">
              <span className="font-medium">Preço:</span>{' '}
              <span>{formatCurrency(produto.preco_normal)}</span>
            </div>
            
            <div className="bg-gray-100 px-2 py-1 rounded">
              <span className="font-medium">Estoque:</span>{' '}
              <span>{produto.estoque || 0}</span>
            </div>
            
            <div className="bg-gray-100 px-2 py-1 rounded">
              <span className="font-medium">Categoria:</span>{' '}
              <span>{produto.categoria}</span>
            </div>
            
            <div className="bg-construPro-orange/10 text-construPro-orange px-2 py-1 rounded flex items-center">
              <span>Pontos:</span>
              <span className="ml-1">{produto.pontos_consumidor}</span>
            </div>
            
            <ProductStatusBadge status={produto.status} />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProductItem;
