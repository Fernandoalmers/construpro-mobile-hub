
import React, { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import CustomButton from './CustomButton';
import { X } from 'lucide-react';

interface CustomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  showCloseButton?: boolean;
  onConfirm?: () => void;
  confirmText?: string;
  onCancel?: () => void;
  cancelText?: string;
  showFooterButtons?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const CustomModal: React.FC<CustomModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  showCloseButton = true,
  onConfirm,
  confirmText = 'Confirmar',
  onCancel,
  cancelText = 'Cancelar',
  showFooterButtons = false,
  size = 'md'
}) => {
  const sizeClassMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-h-[90vh] p-0 overflow-hidden ${sizeClassMap[size]}`}>
        {showCloseButton && (
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 z-10 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        )}
        
        <div className="flex flex-col h-full">
          {(title || description) && (
            <DialogHeader className="px-6 pt-6 pb-2">
              {title && <DialogTitle className="text-xl font-bold text-construPro-blue">{title}</DialogTitle>}
              {description && <DialogDescription className="text-gray-600">{description}</DialogDescription>}
            </DialogHeader>
          )}

          <ScrollArea className="flex-1 max-h-[calc(90vh-180px)]">
            <div className="px-6 py-4">
              {children}
            </div>
          </ScrollArea>

          {(showFooterButtons || footer) && (
            <div className="border-t px-6 py-4 mt-auto">
              {showFooterButtons && (
                <DialogFooter className="flex gap-2 justify-end">
                  {onCancel && (
                    <CustomButton 
                      variant="outline" 
                      onClick={() => {
                        onCancel();
                        onOpenChange(false);
                      }}
                    >
                      {cancelText}
                    </CustomButton>
                  )}
                  {onConfirm && (
                    <CustomButton 
                      variant="primary" 
                      onClick={() => {
                        onConfirm();
                        onOpenChange(false);
                      }}
                    >
                      {confirmText}
                    </CustomButton>
                  )}
                </DialogFooter>
              )}

              {footer && <div>{footer}</div>}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomModal;
