
import React from 'react';
import { Store } from '@/services/marketplace/marketplaceService';
import Card from '../../common/Card';

interface StoreCardProps {
  store: Store;
  onLojaClick: (lojaId: string) => void;
}

const StoreCard: React.FC<StoreCardProps> = ({ store, onLojaClick }) => {
  return (
    <Card 
      className="p-3 flex flex-col items-center justify-center gap-2"
      onClick={() => onLojaClick(store.id)}
    >
      <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
        {store.logo_url ? (
          <img 
            src={store.logo_url} 
            alt={store.nome_loja} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-2xl font-semibold text-gray-400">
            {store.nome_loja.charAt(0)}
          </div>
        )}
      </div>
      <span className="text-sm font-medium text-center line-clamp-2">
        {store.nome_loja}
      </span>
    </Card>
  );
};

interface StoresSectionProps {
  stores: Store[];
  onLojaClick: (lojaId: string) => void;
  storesError: string | null;
}

const StoresSection: React.FC<StoresSectionProps> = ({ 
  stores,
  onLojaClick,
  storesError
}) => {
  if (storesError) {
    return (
      <div className="px-3 py-4 bg-white border-b">
        <div className="text-red-500 text-center">{storesError}</div>
      </div>
    );
  }
  
  if (stores.length === 0) {
    return null;
  }

  return (
    <div className="px-3 py-4 bg-white border-b">
      <h2 className="text-lg font-semibold mb-3">Lojas Disponíveis</h2>
      <div className="grid grid-cols-4 gap-3">
        {stores.map(store => (
          <StoreCard key={store.id} store={store} onLojaClick={onLojaClick} />
        ))}
      </div>
    </div>
  );
};

export default StoresSection;
