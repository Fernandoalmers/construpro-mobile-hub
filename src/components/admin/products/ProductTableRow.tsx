
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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
  const [showDetails, setShowDetails] = React.useState(false);

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
          onClick={() => setShowDetails(true)}
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

      {/* Dialog de Detalhes do Produto */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Produto</DialogTitle>
            <DialogDescription>
              Informações completas sobre o produto
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              {product.imagemUrl ? (
                <img 
                  src={product.imagemUrl} 
                  alt={product.nome}
                  className="w-full aspect-square object-cover rounded-md"
                />
              ) : (
                <div className="w-full aspect-square bg-gray-200 rounded-md flex items-center justify-center">
                  <span className="text-gray-400">Sem imagem</span>
                </div>
              )}
              
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
                <Badge className={getStatusBadgeClass(product.status)}>
                  {product.status === 'pendente' ? 'Pendente' : 
                  product.status === 'aprovado' ? 'Aprovado' : 'Inativo'}
                </Badge>
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
                        handleRejectProduct(product.id);
                        setShowDetails(false);
                      }}
                    >
                      Rejeitar
                    </Button>
                    <Button 
                      variant="default"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        handleApproveProduct(product.id);
                        setShowDetails(false);
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
                      handleRejectProduct(product.id);
                      setShowDetails(false);
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
                      handleApproveProduct(product.id);
                      setShowDetails(false);
                    }}
                  >
                    Reativar
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => setShowDetails(false)}
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TableRow>
  );
};

export default ProductTableRow;
