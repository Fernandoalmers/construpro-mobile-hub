
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { AdminProduct } from '@/types/admin';
import ProductImage from './ProductImage';
import StatusBadge from './StatusBadge';

interface ProductDetailsDialogProps {
  product: AdminProduct;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: () => void;
  onReject: () => void;
}

const ProductDetailsDialog: React.FC<ProductDetailsDialogProps> = ({
  product,
  open,
  onOpenChange,
  onApprove,
  onReject
}) => {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalhes do Produto</DialogTitle>
          <DialogDescription>
            Informações completas sobre o produto
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div>
            <ProductImage 
              imagemUrl={product.imagemUrl} 
              productName={product.nome} 
              size="lg" 
            />
            
            {/* Mais imagens */}
            {product.imagens && product.imagens.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {product.imagens.slice(0, 4).map((img, index) => (
                  <img 
                    key={index} 
                    src={img} 
                    alt={`${product.nome} ${index}`}
                    className="w-full aspect-square object-cover rounded-md"
                  />
                ))}
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-xl">{product.nome}</h3>
              <p className="text-sm text-gray-500">{product.categoria}</p>
              <StatusBadge status={product.status} />
            </div>
            
            <div>
              <h4 className="font-semibold">Descrição</h4>
              <p className="text-gray-700">{product.descricao}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold">Preço</h4>
                <p className="text-gray-700">{formatCurrency(product.preco)}</p>
                {product.preco_promocional && (
                  <p className="text-sm line-through text-gray-500">
                    {formatCurrency(product.preco_promocional)}
                  </p>
                )}
              </div>
              
              <div>
                <h4 className="font-semibold">Estoque</h4>
                <p className="text-gray-700">{product.estoque} unidades</p>
              </div>
              
              <div>
                <h4 className="font-semibold">Pontos</h4>
                <p className="text-gray-700">{product.pontos} pts</p>
                {product.pontos_profissional && product.pontos_profissional !== product.pontos && (
                  <p className="text-sm text-gray-500">Prof: {product.pontos_profissional} pts</p>
                )}
              </div>
              
              <div>
                <h4 className="font-semibold">Loja</h4>
                <p className="text-gray-700">{product.lojaNome || 'N/A'}</p>
              </div>
            </div>
            
            <div className="pt-4 flex gap-2 justify-end">
              {product.status === 'pendente' && (
                <>
                  <Button 
                    variant="outline"
                    className="text-red-600"
                    onClick={() => {
                      onReject();
                      onOpenChange(false);
                    }}
                  >
                    Rejeitar
                  </Button>
                  <Button 
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      onApprove();
                      onOpenChange(false);
                    }}
                  >
                    Aprovar
                  </Button>
                </>
              )}
              
              {product.status === 'aprovado' && (
                <Button 
                  variant="outline"
                  className="text-red-600"
                  onClick={() => {
                    onReject();
                    onOpenChange(false);
                  }}
                >
                  Desativar
                </Button>
              )}
              
              {product.status === 'inativo' && (
                <Button 
                  variant="outline"
                  className="text-green-600"
                  onClick={() => {
                    onApprove();
                    onOpenChange(false);
                  }}
                >
                  Reativar
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsDialog;
