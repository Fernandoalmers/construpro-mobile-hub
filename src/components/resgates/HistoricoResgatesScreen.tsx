
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../common/Card';
import Avatar from '../common/Avatar';
import ListEmptyState from '../common/ListEmptyState';
import { ArrowLeft, Clock, Gift, CheckCircle, Truck, AlertCircle } from 'lucide-react';
import resgates from '../../data/resgates.json';
import clientes from '../../data/clientes.json';

const HistoricoResgatesScreen: React.FC = () => {
  const navigate = useNavigate();
  // Use the first client as the logged in user for demo
  const currentUser = clientes[0];
  
  // Filter resgates for the current user
  const userResgates = resgates.filter(resgate => resgate.clienteId === currentUser.id);

  // Helper function to render status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Aprovado':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'Em Separação':
        return <Clock size={16} className="text-amber-500" />;
      case 'Em Trânsito':
        return <Truck size={16} className="text-blue-500" />;
      case 'Entregue':
        return <CheckCircle size={16} className="text-green-500" />;
      default:
        return <AlertCircle size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-white p-4 flex items-center shadow-sm">
        <button onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Histórico de Resgates</h1>
      </div>
      
      <div className="p-6">
        {userResgates.length > 0 ? (
          <div className="space-y-4">
            {userResgates.map(resgate => (
              <Card key={resgate.id} className="p-4 flex gap-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                  <img 
                    src={resgate.imagemUrl} 
                    alt={resgate.item}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-medium">{resgate.item}</h3>
                  
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <span className="bg-construPro-orange/10 text-construPro-orange rounded-full px-2 py-0.5 inline-block mr-2">
                      {resgate.pontos} pontos
                    </span>
                    <span>
                      {new Date(resgate.data).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center">
                      {getStatusIcon(resgate.status)}
                      <span className="ml-1 text-sm">{resgate.status}</span>
                    </div>
                    
                    {resgate.codigo && (
                      <span className="text-sm bg-gray-100 px-2 py-0.5 rounded">
                        Código: {resgate.codigo}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <ListEmptyState
            title="Histórico vazio"
            description="Você ainda não realizou nenhum resgate de pontos."
            icon={<Gift size={40} />}
            action={{
              label: "Explorar Recompensas",
              onClick: () => navigate('/resgates')
            }}
          />
        )}
      </div>
    </div>
  );
};

export default HistoricoResgatesScreen;
