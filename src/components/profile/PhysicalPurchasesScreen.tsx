import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Receipt, Store, Calendar, CircleDollarSign, FileText } from 'lucide-react';
import Card from '../common/Card';
import { useAuth } from '../../context/AuthContext';

// Simulated physical purchases data (in a real app, this would come from an API)
const mockPhysicalPurchases = [{
  id: "nf-1234",
  clienteId: "1",
  numeroNF: "1234",
  loja: "ConstruPro São Paulo",
  valor: 1250.75,
  pontos: 500,
  data: "2025-04-10T14:45:00",
  itens: ["Tinta Acrílica", "Kit de Ferramentas", "Fita Adesiva"]
}, {
  id: "nf-2345",
  clienteId: "1",
  numeroNF: "2345",
  loja: "ConstruPro Rio de Janeiro",
  valor: 780.30,
  pontos: 300,
  data: "2025-03-22T10:15:00",
  itens: ["Cimento", "Argamassa", "Piso Cerâmico"]
}, {
  id: "nf-3456",
  clienteId: "2",
  numeroNF: "3456",
  loja: "ConstruPro Belo Horizonte",
  valor: 450.00,
  pontos: 180,
  data: "2025-03-15T16:30:00",
  itens: ["Tomadas", "Interruptores", "Cabos Elétricos"]
}, {
  id: "nf-4567",
  clienteId: "1",
  numeroNF: "4567",
  loja: "ConstruPro São Paulo",
  valor: 320.45,
  pontos: 130,
  data: "2025-02-28T09:20:00",
  itens: ["Parafusos", "Buchas", "Furadeira"]
}, {
  id: "nf-5678",
  clienteId: "3",
  numeroNF: "5678",
  loja: "ConstruPro Curitiba",
  valor: 890.00,
  pontos: 360,
  data: "2025-02-15T11:10:00",
  itens: ["Madeira", "Serra", "Lixa"]
}];
const PhysicalPurchasesScreen: React.FC = () => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const userId = user?.id || "1"; // Default to first client if no user

  // Filter purchases by client ID
  const clientPurchases = mockPhysicalPurchases.filter(purchase => purchase.clienteId === userId);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };
  return <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-construPro-blue p-6 pt-12">
        <div className="flex items-center mb-4">
          <button onClick={() => navigate('/profile')} className="text-white">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-white ml-2">Compras Físicas</h1>
        </div>
      </div>
      
      {/* Explanation */}
      <div className="px-6 -mt-6">
        <Card className="p-4">
          <div className="flex items-start">
            <Receipt size={24} className="text-construPro-orange mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium">Notas fiscais vinculadas ao seu CPF</h3>
              <p className="text-sm text-gray-600 mt-1">Aqui você encontra todas as compras feitas nas lojas físicas da Matershop com o seu CPF.</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Purchases List */}
      <div className="p-6 space-y-4">
        <h2 className="font-medium">Histórico de compras</h2>
        
        {clientPurchases.length === 0 ? <div className="text-center py-10">
            <Receipt className="mx-auto text-gray-400 mb-3" size={40} />
            <h3 className="text-lg font-medium text-gray-700">Nenhuma compra física</h3>
            <p className="text-gray-500 mt-1">
              Você ainda não tem compras físicas registradas com seu CPF
            </p>
          </div> : clientPurchases.map(purchase => <Card key={purchase.id} className="overflow-hidden">
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-sm text-gray-500">NF #{purchase.numeroNF}</span>
                    <h3 className="font-medium">{purchase.loja}</h3>
                  </div>
                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                    Registrada
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-y-2 mb-3">
                  <div className="w-1/2 flex items-center text-sm text-gray-600">
                    <Calendar size={14} className="mr-1" />
                    <span>{formatDate(purchase.data)}</span>
                  </div>
                  
                  <div className="w-1/2 flex items-center text-sm text-gray-600">
                    <FileText size={14} className="mr-1" />
                    <span>NF: {purchase.numeroNF}</span>
                  </div>
                  
                  <div className="w-1/2 flex items-center text-sm text-gray-600">
                    <CircleDollarSign size={14} className="mr-1" />
                    <span>{purchase.pontos} pontos</span>
                  </div>
                  
                  <div className="w-1/2 flex items-center text-sm font-medium">
                    R$ {purchase.valor.toFixed(2)}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-2 rounded-md">
                  <p className="text-xs text-gray-500 mb-1">Itens comprados:</p>
                  <p className="text-sm">{purchase.itens.join(", ")}</p>
                </div>
              </div>
            </Card>)}
      </div>
    </div>;
};
export default PhysicalPurchasesScreen;