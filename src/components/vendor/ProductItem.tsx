
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import Card from '../common/Card';
import CustomButton from '../common/CustomButton';
import ProductStatusBadge from './ProductStatusBadge';

export interface ProdutoVendor {
  id: string;
  nome: string;
  preco: number;
  estoque: number;
  imagemUrl: string;
  status: 'ativo' | 'inativo' | 'pendente';
}

interface ProductItemProps {
  produto: ProdutoVendor;
  onToggleStatus: (id: string) => void;
}

const ProductItem: React.FC<ProductItemProps> = ({ produto, onToggleStatus }) => {
  const navigate = useNavigate();
  
  return (
    <Card className="p-4">
      <div className="flex gap-3">
        <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden">
          <img 
            src={produto.imagemUrl}
            alt={produto.nome}
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between">
            <h3 className="font-medium line-clamp-1">{produto.nome}</h3>
            {produto.status !== 'pendente' && (
              <Switch
                checked={produto.status === 'ativo'}
                onCheckedChange={() => onToggleStatus(produto.id)}
              />
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            <ProductStatusBadge status={produto.status} />
            <span className="text-sm text-gray-500">
              <Tag size={12} className="inline mr-1" />
              R$ {produto.preco.toFixed(2)}
            </span>
          </div>
          
          <div className="mt-2 flex justify-between items-center">
            <span className="text-xs text-gray-500">
              Estoque: {produto.estoque} unid.
            </span>
            <CustomButton
              variant="outline"
              size="sm"
              onClick={() => navigate(`/vendor/product-edit/${produto.id}`)}
            >
              Editar
            </CustomButton>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProductItem;
