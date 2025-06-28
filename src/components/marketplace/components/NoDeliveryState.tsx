
import React from 'react';

interface NoDeliveryStateProps {
  currentCep: string | null;
  onChangeCep: () => void;
}

const NoDeliveryState: React.FC<NoDeliveryStateProps> = ({
  currentCep,
  onChangeCep
}) => {
  return (
    <div className="text-center py-12">
      <div className="max-w-sm mx-auto">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Nenhum lojista atende esse endereço
        </h3>
        <p className="text-gray-600 mb-6">
          Não encontramos vendedores que fazem entrega para o CEP {currentCep?.replace(/(\d{5})(\d{3})/, '$1-$2')}. 
          Tente um CEP diferente.
        </p>
        <div className="space-y-3">
          <button
            onClick={onChangeCep}
            className="w-full bg-construPro-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-construPro-blue-dark transition-colors"
          >
            Alterar CEP
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoDeliveryState;
