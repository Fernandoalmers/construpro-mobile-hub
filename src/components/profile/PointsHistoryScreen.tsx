
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CircleDollarSign, Filter, ShoppingBag, Users, Gift, Receipt } from 'lucide-react';
import Card from '../common/Card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from '../../context/AuthContext';
import pedidos from '../../data/pedidos.json';
import resgates from '../../data/resgates.json';

// Vamos simular transações de pontos baseado nos dados existentes
const generatePointsTransactions = (userId: string) => {
  const transactions = [];

  // Transações de compras
  pedidos
    .filter(pedido => pedido.clienteId === userId)
    .forEach(pedido => {
      transactions.push({
        id: `compra-${pedido.id}`,
        tipo: 'compra',
        pontos: pedido.pontosGanhos,
        data: pedido.data,
        descricao: `Compra no app - Pedido #${pedido.id}`,
        referencia: pedido.id
      });
    });
  
  // Transações de resgates
  resgates
    .filter(resgate => resgate.clienteId === userId)
    .forEach(resgate => {
      transactions.push({
        id: `resgate-${resgate.id}`,
        tipo: 'resgate',
        pontos: -resgate.pontos,
        data: resgate.data,
        descricao: `Resgate de ${resgate.item}`,
        referencia: resgate.id
      });
    });
  
  // Simular algumas transações adicionais
  transactions.push({
    id: 'ind-1',
    tipo: 'indicacao',
    pontos: 300,
    data: '2025-04-15T10:30:00',
    descricao: 'Indicação aprovada - João Silva',
    referencia: 'user-123'
  });
  
  transactions.push({
    id: 'nf-1',
    tipo: 'loja-fisica',
    pontos: 500,
    data: '2025-04-10T14:45:00',
    descricao: 'Compra loja física (NF 1234)',
    referencia: 'nf-1234'
  });
  
  // Ordenar por data (mais recente primeiro)
  return transactions.sort((a, b) => 
    new Date(b.data).getTime() - new Date(a.data).getTime()
  );
};

const PointsHistoryScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id || "1"; // Default to first client if no user
  
  const [typeFilter, setTypeFilter] = useState<string>("todos");
  const [periodFilter, setPeriodFilter] = useState<string>("todos");
  
  // Generate transactions
  const allTransactions = generatePointsTransactions(userId);
  
  // Apply filters
  let filteredTransactions = [...allTransactions];
  
  // Apply type filter
  if (typeFilter !== "todos") {
    filteredTransactions = filteredTransactions.filter(t => t.tipo === typeFilter);
  }
  
  // Apply period filter
  if (periodFilter !== "todos") {
    const now = new Date();
    let startDate: Date;
    
    switch (periodFilter) {
      case "30dias":
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
      case "90dias":
        startDate = new Date(now.setDate(now.getDate() - 90));
        break;
      case "6meses":
        startDate = new Date(now.setMonth(now.getMonth() - 6));
        break;
      default:
        startDate = new Date(0); // Beginning of time
    }
    
    filteredTransactions = filteredTransactions.filter(t => 
      new Date(t.data) >= startDate
    );
  }
  
  // Calculate total points
  const totalPoints = allTransactions.reduce((sum, t) => sum + t.pontos, 0);
  
  // Get icon for transaction type
  const getTransactionIcon = (type: string) => {
    switch(type) {
      case 'compra':
        return <ShoppingBag size={18} className="text-green-600" />;
      case 'resgate':
        return <Gift size={18} className="text-red-600" />;
      case 'indicacao':
        return <Users size={18} className="text-blue-600" />;
      case 'loja-fisica':
        return <Receipt size={18} className="text-purple-600" />;
      default:
        return <CircleDollarSign size={18} className="text-gray-600" />;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-construPro-blue p-6 pt-12">
        <div className="flex items-center mb-4">
          <button onClick={() => navigate('/profile')} className="text-white">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-white ml-2">Pontos e Extrato</h1>
        </div>
      </div>
      
      {/* Points Summary */}
      <div className="px-6 -mt-6">
        <Card className="p-4">
          <h3 className="text-sm text-gray-600 mb-1">Saldo atual</h3>
          <div className="flex items-baseline">
            <CircleDollarSign size={28} className="text-construPro-orange mr-2" />
            <span className="text-3xl font-bold">{totalPoints}</span>
            <span className="ml-1 text-gray-600">pontos</span>
          </div>
        </Card>
      </div>
      
      {/* Filters */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium">Extrato de pontos</h2>
          <Button variant="outline" size="sm" className="flex items-center">
            <Filter size={14} className="mr-1" />
            Filtros
          </Button>
        </div>
        
        <div className="flex gap-3 mb-4">
          <Select defaultValue="todos" onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="compra">Compras app</SelectItem>
              <SelectItem value="loja-fisica">Compras físicas</SelectItem>
              <SelectItem value="resgate">Resgates</SelectItem>
              <SelectItem value="indicacao">Indicações</SelectItem>
            </SelectContent>
          </Select>
          
          <Select defaultValue="todos" onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todo período</SelectItem>
              <SelectItem value="30dias">Últimos 30 dias</SelectItem>
              <SelectItem value="90dias">Últimos 90 dias</SelectItem>
              <SelectItem value="6meses">Últimos 6 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Transactions */}
        <Card className="overflow-hidden">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-10">
              <CircleDollarSign className="mx-auto text-gray-400 mb-3" size={40} />
              <h3 className="text-lg font-medium text-gray-700">Nenhuma transação encontrada</h3>
              <p className="text-gray-500 mt-1">Não há transações com os filtros selecionados</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredTransactions.map((transaction, index) => (
                <div key={transaction.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex">
                      {getTransactionIcon(transaction.tipo)}
                      <div className="ml-3">
                        <p className="font-medium">{transaction.descricao}</p>
                        <p className="text-xs text-gray-500">{formatDate(transaction.data)}</p>
                      </div>
                    </div>
                    <div className={`font-medium ${transaction.pontos > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.pontos > 0 ? '+' : ''}{transaction.pontos}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PointsHistoryScreen;
