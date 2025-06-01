
import React from 'react';
import AutoFixMissingCodes from '@/components/admin/AutoFixMissingCodes';

const AutoFixCodesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Correção Automática de Códigos</h1>
          <p className="text-gray-600 mt-2">
            Executando a correção de códigos de indicação para usuários como Wemerson Thadiole Silva
          </p>
        </div>
        
        <AutoFixMissingCodes />
      </div>
    </div>
  );
};

export default AutoFixCodesPage;
