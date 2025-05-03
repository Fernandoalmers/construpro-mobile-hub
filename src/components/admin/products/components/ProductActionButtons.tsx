
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, Eye } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface ProductActionButtonsProps {
  status: string;
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
}

const ProductActionButtons: React.FC<ProductActionButtonsProps> = ({
  status,
  onView,
  onApprove,
  onReject
}) => {
  // Ensure the event handlers are properly triggered
  const handleView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onView();
  };
  
  const handleApprove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Approve button clicked, status:', status);
    
    try {
      onApprove();
      toast.success('Produto aprovado com sucesso');
      console.log('Product approval function called');
    } catch (error) {
      console.error('Error approving product:', error);
      toast.error('Erro ao aprovar produto');
    }
  };
  
  const handleReject = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Reject button clicked, status:', status);
    
    try {
      onReject();
      toast.success('Produto rejeitado com sucesso');
      console.log('Product rejection function called');
    } catch (error) {
      console.error('Error rejecting product:', error);
      toast.error('Erro ao rejeitar produto');
    }
  };

  return (
    <div className="space-x-2">
      <Button 
        size="sm" 
        variant="outline" 
        className="h-8 w-8 p-0 text-blue-600"
        title="Ver detalhes"
        onClick={handleView}
      >
        <Eye className="h-4 w-4" />
      </Button>
      
      {status === 'pendente' && (
        <>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-8 w-8 p-0 text-green-600"
            onClick={handleApprove}
            title="Aprovar produto"
            data-testid="approve-product-button"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-8 w-8 p-0 text-red-600"
            onClick={handleReject}
            title="Rejeitar produto"
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      )}
      
      {status === 'aprovado' && (
        <Button 
          size="sm" 
          variant="outline" 
          className="h-8 w-8 p-0 text-red-600"
          onClick={handleReject}
          title="Desativar produto"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      
      {status === 'inativo' && (
        <Button 
          size="sm" 
          variant="outline" 
          className="h-8 w-8 p-0 text-green-600"
          onClick={handleApprove}
          title="Reativar produto"
        >
          <Check className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default ProductActionButtons;
