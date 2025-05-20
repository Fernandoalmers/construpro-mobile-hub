
import React from 'react';
import { Search } from 'lucide-react';
import { Card } from '@/components/ui/card';

const EmptyCustomerState: React.FC = () => {
  return (
    <Card className="p-6 text-center border border-dashed border-gray-300 bg-gray-50">
      <Search className="h-12 w-12 mx-auto text-gray-400 mb-3" />
      <h3 className="text-lg font-medium text-gray-700 mb-2">Busque um cliente</h3>
      <p className="text-gray-500 max-w-md mx-auto">
        Utilize o campo de busca acima para encontrar um cliente pelo nome, CPF, 
        e-mail ou telefone e realizar o ajuste de pontos.
      </p>
    </Card>
  );
};

export default EmptyCustomerState;
