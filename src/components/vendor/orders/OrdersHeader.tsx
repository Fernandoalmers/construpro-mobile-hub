
import React from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrdersHeaderProps {
  onBack: () => void;
  onRefresh: () => void;
  isRefetching: boolean;
}

const OrdersHeader: React.FC<OrdersHeaderProps> = ({ onBack, onRefresh, isRefetching }) => {
  return (
    <div className="bg-white p-4 flex items-center shadow-sm">
      <button onClick={onBack} className="mr-4">
        <ArrowLeft size={24} />
      </button>
      <h1 className="text-xl font-bold">Pedidos</h1>
      <div className="ml-auto">
        <Button
          size="sm"
          variant="outline"
          onClick={onRefresh}
          disabled={isRefetching}
          className="flex items-center gap-1"
        >
          <RefreshCw size={16} className={isRefetching ? "animate-spin" : ""} />
          Atualizar
        </Button>
      </div>
    </div>
  );
};

export default OrdersHeader;
