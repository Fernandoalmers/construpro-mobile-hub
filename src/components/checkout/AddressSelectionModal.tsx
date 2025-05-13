
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Address } from '@/services/addressService';

interface AddressSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addresses: Address[];
  onSelectAddress: (address: Address) => void;
  onAddNewAddress: () => void;
}

const AddressSelectionModal: React.FC<AddressSelectionModalProps> = ({
  open,
  onOpenChange,
  addresses,
  onSelectAddress,
  onAddNewAddress
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Escolha um endereço</DialogTitle>
        </DialogHeader>
        
        <div className="py-2 space-y-3">
          {addresses.length > 0 ? (
            addresses.map((addr) => (
              <div 
                key={addr.id}
                className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 ${addr.principal ? 'border-construPro-blue bg-blue-50' : 'border-gray-200'}`}
                onClick={() => onSelectAddress(addr)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{addr.logradouro}, {addr.numero}</p>
                    {addr.complemento && (
                      <p className="text-sm text-gray-600">{addr.complemento}</p>
                    )}
                    <p className="text-sm text-gray-600">
                      {addr.bairro}, {addr.cidade} - {addr.estado}
                    </p>
                    <p className="text-sm text-gray-600">{addr.cep}</p>
                  </div>
                  {addr.principal && (
                    <span className="text-xs bg-construPro-blue text-white px-2 py-1 rounded-full">
                      Principal
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">Nenhum endereço cadastrado</p>
          )}
          
          <Button variant="outline" className="w-full mt-2 flex items-center justify-center" onClick={onAddNewAddress}>
            <Plus size={16} className="mr-1" />
            Adicionar novo endereço
          </Button>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddressSelectionModal;
