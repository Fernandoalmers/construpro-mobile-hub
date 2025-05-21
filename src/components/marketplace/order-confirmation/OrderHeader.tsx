
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OrderHeader: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="bg-white p-4 flex items-center shadow-sm">
      <button onClick={() => navigate(-1)} className="mr-4">
        <ArrowLeft size={24} />
      </button>
      <h1 className="text-xl font-bold">Confirmação de Pedido</h1>
    </div>
  );
};

export default OrderHeader;
