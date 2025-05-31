
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface OrderHeaderProps {
  orderId: string;
  status: string;
  referenceId?: string;
}

const OrderHeader: React.FC<OrderHeaderProps> = ({ orderId, status, referenceId }) => {
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case "entregue":
        return "bg-green-100 text-green-800";
      case "enviado":
        return "bg-blue-100 text-blue-800";
      case "processando":
        return "bg-yellow-100 text-yellow-800";
      case "confirmado":
        return "bg-purple-100 text-purple-800";
      case "pendente":
        return "bg-orange-100 text-orange-800";
      case "cancelado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Use reference_id for display if available, otherwise fallback to orderId
  const displayId = referenceId ? referenceId.substring(0, 8).toUpperCase() : orderId.substring(0, 8).toUpperCase();

  return (
    <div className="bg-white p-4 flex items-center shadow-sm">
      <button onClick={() => navigate('/vendor/orders')} className="mr-4">
        <ChevronLeft size={24} />
      </button>
      <div className="flex-1">
        <h1 className="text-xl font-bold">Pedido #{displayId}</h1>
        <Badge className={getStatusBadge(status)}>
          {status}
        </Badge>
      </div>
    </div>
  );
};

export default OrderHeader;
