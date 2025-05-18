
import React from 'react';
import CustomInput from '@/components/common/CustomInput';

interface OrderFiltersProps {
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  filterStatus: string | null;
  setFilterStatus: (status: string | null) => void;
  orderStatuses: Array<{ value: string; label: string }>;
}

const OrderFilters: React.FC<OrderFiltersProps> = ({
  searchTerm,
  onSearchChange,
  filterStatus,
  setFilterStatus,
  orderStatuses
}) => {
  return (
    <div className="space-y-4">
      <CustomInput
        placeholder="Buscar por nome do cliente ou código do pedido..."
        value={searchTerm}
        onChange={onSearchChange}
        isSearch
        className="w-full"
      />
      
      <div className="flex overflow-x-auto gap-2 pb-2">
        <button
          onClick={() => setFilterStatus(null)}
          className={`whitespace-nowrap px-3 py-1 text-sm rounded-full ${
            filterStatus === null 
              ? 'bg-construPro-blue text-white' 
              : 'bg-gray-200 text-gray-800'
          }`}
        >
          Todos
        </button>
        
        {orderStatuses.map(status => (
          <button
            key={status.value}
            onClick={() => setFilterStatus(status.value === filterStatus ? null : status.value)}
            className={`whitespace-nowrap px-3 py-1 text-sm rounded-full ${
              status.value === filterStatus 
                ? 'bg-construPro-blue text-white' 
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            {status.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default OrderFilters;
