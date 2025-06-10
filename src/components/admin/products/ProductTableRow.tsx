
import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { AdminProduct } from '@/types/admin';
import ProductImage from './components/ProductImage';
import PriceDisplay from './components/PriceDisplay';
import PointsDisplay from './components/PointsDisplay';
import StatusBadge from './components/StatusBadge';
import ProductActionButtons from './components/ProductActionButtons';
import ProductDetailsDialog from './components/ProductDetailsDialog';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

interface ProductTableRowProps {
  product: AdminProduct;
  handleApproveProduct: (id: string) => void;
  handleRejectProduct: (id: string) => void;
  showImageDiagnostics?: boolean;
}

const ProductTableRow: React.FC<ProductTableRowProps> = ({
  product,
  handleApproveProduct,
  handleRejectProduct,
  showImageDiagnostics = false
}) => {
  const [showDetails, setShowDetails] = React.useState(false);

  const handleImageError = (error: string) => {
    console.warn(`[ProductTableRow] Image error for product ${product.id} (${product.nome}):`, error);
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center space-x-3">
          <ProductImage 
            imagemUrl={product.imagemUrl} 
            imagens={product.imagens}
            productName={product.nome}
            showDiagnostics={showImageDiagnostics}
            onImageError={handleImageError}
          />
          <div>
            <div className="font-medium">{product.nome}</div>
            <div className="text-xs text-gray-500">{product.categoria}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="font-medium">{product.vendedores?.nome_loja || 'N/A'}</div>
              {product.vendedor_id && (
                <div className="text-xs text-gray-500">ID: {product.vendedor_id.substring(0, 8)}...</div>
              )}
            </TooltipTrigger>
            <TooltipContent>
              <p>Vendedor: {product.vendedores?.nome_loja || product.lojaNome}</p>
              {product.vendedor_id && <p>ID completo: {product.vendedor_id}</p>}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell>
        <PriceDisplay
          preco={product.preco}
          preco_promocional={product.preco_promocional}
        />
      </TableCell>
      <TableCell>
        <PointsDisplay
          pontos={product.pontos}
          pontos_profissional={product.pontos_profissional}
        />
      </TableCell>
      <TableCell>{product.estoque}</TableCell>
      <TableCell>
        <StatusBadge status={product.status} />
      </TableCell>
      <TableCell className="text-right">
        <ProductActionButtons 
          status={product.status}
          onView={() => setShowDetails(true)}
          onApprove={() => handleApproveProduct(product.id)}
          onReject={() => handleRejectProduct(product.id)}
        />
      </TableCell>

      {/* Product Details Dialog */}
      <ProductDetailsDialog 
        product={product}
        open={showDetails}
        onOpenChange={setShowDetails}
        onApprove={() => handleApproveProduct(product.id)}
        onReject={() => handleRejectProduct(product.id)}
      />
    </TableRow>
  );
};

export default ProductTableRow;
