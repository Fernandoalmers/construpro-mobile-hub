
import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ListEmptyState from '@/components/common/ListEmptyState';

const EmptyCart: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 flex-1 flex items-center justify-center">
      <ListEmptyState
        title="Seu carrinho está vazio"
        description="Explore nosso marketplace para adicionar produtos ao seu carrinho."
        icon={<ShoppingBag size={40} />}
        action={{
          label: "Ir para o Marketplace",
          onClick: () => navigate('/marketplace')
        }}
      />
    </div>
  );
};

export default EmptyCart;
