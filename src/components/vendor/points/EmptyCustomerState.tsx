
import React from 'react';
import { Search } from 'lucide-react';
import { Card } from '@/components/ui/card';

const EmptyCustomerState: React.FC = () => {
  return (
    <Card className="p-6 text-center border border-dashed border-gray-300 bg-gray-50">
      <Search className="h-12 w-12 mx-auto text-gray-400 mb-3" />
      <h3 className="text-lg font-medium text-gray-700 mb-2">Busque um cliente</h3>
      <p className="text-gray-500 max-w-md mx-auto mb-4">
        Utilize o campo de busca acima para encontrar um cliente pelo nome, CPF, 
        e-mail ou telefone e realizar o ajuste de pontos.
      </p>
      <div className="text-xs text-gray-400 p-2 bg-gray-100 rounded-md max-w-md mx-auto">
        <p className="font-medium mb-1">Dicas de busca:</p>
        <ul className="list-disc list-inside text-left space-y-1">
          <li>Digite o nome completo ou parte do nome do cliente</li>
          <li>Busque por CPF com ou sem pontuação</li>
          <li>Digite o email completo ou parte dele</li>
          <li>Busque por telefone com ou sem formatação</li>
        </ul>
      </div>
    </Card>
  );
};

export default EmptyCustomerState;
