
import React from 'react';
import { useParams } from 'react-router-dom';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';

const StoreDetailScreen: React.FC = () => {
  const { storeId } = useParams();

  if (!storeId) {
    return <ErrorState title="Erro" message="ID da loja não encontrado" />;
  }

  return (
    <div className="flex flex-col bg-gray-100 min-h-screen pb-20">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Detalhes da Loja</h1>
        <LoadingState text="Carregando loja..." />
      </div>
    </div>
  );
};

export default StoreDetailScreen;
