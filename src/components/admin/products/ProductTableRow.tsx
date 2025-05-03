
import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Eye } from 'lucide-react';
import { AdminProduct } from '@/types/admin';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProductTableRowProps {
  product: AdminProduct;
  handleApproveProduct: (id: string) => void;
  handleRejectProduct: (id: string) => void;
}

const ProductTableRow: React.FC<ProductTableRowProps> = ({
  product,
  handleApproveProduct,
  handleRejectProduct
}) => {
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'aprovado': return 'bg-green-100 text-green-800';
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'inativo': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center space-x-3">
          {product.imagemUrl ? (
            <img 
              src={product.imagemUrl} 
              alt={product.nome}
              className="w-10 h-10 object-cover rounded"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                if (target.nextElementSibling) {
                  (target.nextElementSibling as HTMLElement).style.display = 'flex';
                }
              }}
            />
          ) : null}
          <div 
            className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-400"
            style={{ display: product.imagemUrl ? 'none' : 'flex' }}
          >
            <span className="text-xs">Imagem</span>
          </div>
          <div>
            <div className="font-medium">{product.nome}</div>
            <div className="text-xs text-gray-500">{product.categoria}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>{product.lojaNome || 'N/A'}</TableCell>
      <TableCell>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="font-medium">{formatCurrency(product.preco)}</div>
              {product.preco_promocional && (
                <div className="text-xs line-through text-gray-500">
                  {formatCurrency(product.preco_promocional)}
                </div>
              )}
            </TooltipTrigger>
            <TooltipContent>
              <p>Preço regular: {formatCurrency(product.preco)}</p>
              {product.preco_promocional && (
                <p>Preço promocional: {formatCurrency(product.preco_promocional)}</p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{product.pontos}</span>
          {product.pontos_profissional && product.pontos_profissional !== product.pontos && (
            <span className="text-xs text-gray-500">Prof: {product.pontos_profissional}</span>
          )}
        </div>
      </TableCell>
      <TableCell>{product.estoque}</TableCell>
      <TableCell>
        <Badge className={getStatusBadgeClass(product.status)}>
          {product.status === 'pendente' ? 'Pendente' : 
           product.status === 'aprovado' ? 'Aprovado' : 'Inativo'}
        </Badge>
      </TableCell>
      <TableCell className="text-right space-x-2">
        <Button 
          size="sm" 
          variant="outline" 
          className="h-8 w-8 p-0 text-blue-600"
          title="Ver detalhes"
        >
          <Eye className="h-4 w-4" />
        </Button>
        
        {product.status === 'pendente' && (
          <>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 w-8 p-0 text-green-600"
              onClick={() => handleApproveProduct(product.id)}
              title="Aprovar produto"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 w-8 p-0 text-red-600"
              onClick={() => handleRejectProduct(product.id)}
              title="Rejeitar produto"
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
        
        {product.status === 'aprovado' && (
          <Button 
            size="sm" 
            variant="outline" 
            className="h-8 w-8 p-0 text-red-600"
            onClick={() => handleRejectProduct(product.id)}
            title="Desativar produto"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        
        {product.status === 'inativo' && (
          <Button 
            size="sm" 
            variant="outline" 
            className="h-8 w-8 p-0 text-green-600"
            onClick={() => handleApproveProduct(product.id)}
            title="Reativar produto"
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
};

export default ProductTableRow;
