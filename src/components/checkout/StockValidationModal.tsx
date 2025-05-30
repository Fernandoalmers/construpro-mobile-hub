
import React from 'react';
import { AlertTriangle, Package, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CustomButton from '@/components/common/CustomButton';
import { StockValidationResult } from '@/services/checkout/stockValidation';

interface StockValidationModalProps {
  open: boolean;
  onClose: () => void;
  validationResult: StockValidationResult;
  onRemoveItems: (itemIds: string[]) => void;
  onAdjustItems: (adjustments: { itemId: string; newQuantity: number }[]) => void;
  onContinue: () => void;
  isProcessing?: boolean;
}

const StockValidationModal: React.FC<StockValidationModalProps> = ({
  open,
  onClose,
  validationResult,
  onRemoveItems,
  onAdjustItems,
  onContinue,
  isProcessing = false
}) => {
  const { invalidItems, adjustedItems } = validationResult;
  
  const handleAutoFix = () => {
    // Remove items without stock
    if (invalidItems.length > 0) {
      onRemoveItems(invalidItems.map(item => item.itemId));
    }
    
    // Adjust quantities for items with insufficient stock
    if (adjustedItems.length > 0) {
      onAdjustItems(adjustedItems.map(item => ({
        itemId: item.itemId,
        newQuantity: item.newQuantity
      })));
    }
    
    onContinue();
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle size={20} />
            Problemas de Estoque
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Alguns produtos em seu carrinho não estão mais disponíveis ou têm estoque limitado.
          </p>
          
          {/* Items without stock */}
          {invalidItems.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-red-600 flex items-center gap-1">
                <X size={16} />
                Produtos indisponíveis:
              </h4>
              {invalidItems.map((item) => (
                <div key={item.itemId} className="bg-red-50 p-3 rounded border border-red-200">
                  <p className="font-medium text-sm">{item.productName}</p>
                  <p className="text-xs text-red-600">
                    Solicitado: {item.requestedQuantity} • Disponível: {item.availableStock}
                  </p>
                </div>
              ))}
            </div>
          )}
          
          {/* Items with insufficient stock */}
          {adjustedItems.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-amber-600 flex items-center gap-1">
                <Package size={16} />
                Produtos com estoque limitado:
              </h4>
              {adjustedItems.map((item) => (
                <div key={item.itemId} className="bg-amber-50 p-3 rounded border border-amber-200">
                  <p className="font-medium text-sm">{item.productName}</p>
                  <p className="text-xs text-amber-600">
                    Solicitado: {item.oldQuantity} • Disponível: {item.newQuantity}
                  </p>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex flex-col gap-2 pt-4">
            <CustomButton
              variant="primary"
              fullWidth
              onClick={handleAutoFix}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processando...' : 'Ajustar Carrinho Automaticamente'}
            </CustomButton>
            
            <CustomButton
              variant="outline"
              fullWidth
              onClick={onClose}
              disabled={isProcessing}
            >
              Revisar Manualmente
            </CustomButton>
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            Os produtos indisponíveis serão removidos e as quantidades serão ajustadas automaticamente.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StockValidationModal;
