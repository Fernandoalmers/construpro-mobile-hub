
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface ProductStatusBadgeProps {
  status: string;
}

const ProductStatusBadge: React.FC<ProductStatusBadgeProps> = ({ status }) => {
  switch(status) {
    case 'ativo':
      return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
    case 'inativo':
      return <Badge className="bg-gray-100 text-gray-800">Inativo</Badge>;
    case 'pendente':
      return <Badge className="bg-amber-100 text-amber-800">Pendente aprovação</Badge>;
    default:
      return null;
  }
};

export default ProductStatusBadge;
