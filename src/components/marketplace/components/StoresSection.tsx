
import React from 'react';
import { Store } from '@/services/marketplace/marketplaceService';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShoppingBag } from 'lucide-react';

interface StoresSectionProps {
  stores: Store[];
  onLojaClick: (lojaId: string) => void;
  storesError: string | null;
}

const StoresSection: React.FC<StoresSectionProps> = ({ 
  stores,
  storesError
}) => {
  if (storesError) {
    return null;
  }
  
  if (stores.length === 0) {
    return null;
  }
  
  return (
    <div className="px-2 mb-2 mt-1">
      <div className="mb-1 text-sm font-medium text-gray-700">Lojas</div>
      <ScrollArea className="w-full whitespace-nowrap pb-2" type="always">
        <div className="flex gap-2 pb-1">
          {stores.map(store => (
            <Badge
              key={store.id}
              variant="outline"
              className="bg-white flex items-center gap-1 px-3 py-1 cursor-default hover:bg-gray-50"
            >
              {store.imageUrl && (
                <div className="h-4 w-4 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  <img 
                    src={store.imageUrl} 
                    alt={store.name} 
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40';
                    }}
                  />
                </div>
              )}
              {!store.imageUrl && <ShoppingBag size={14} />}
              <span className="text-xs">{store.name}</span>
            </Badge>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default StoresSection;
