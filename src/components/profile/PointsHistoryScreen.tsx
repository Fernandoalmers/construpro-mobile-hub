import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CircleDollarSign, Filter, ShoppingBag, Users, Gift, Receipt, Briefcase, RefreshCw } from 'lucide-react';
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
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface Transaction {
  id: string;
  tipo: string;
  pontos: number;
  data: string;
  descricao: string;
  referencia_id?: string;
}

const PointsHistoryScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  
  const [typeFilter, setTypeFilter] = useState<string>("todos");
  const [originFilter, setOriginFilter] = useState<string>("todos");
  const [periodFilter, setPeriodFilter] = useState<string>("todos");
  const [showFilters, setShowFilters] = useState(false);
  
  // Call refreshProfile when component mounts to ensure we have the latest data
  useEffect(() => {
    if (user) {
      refreshProfile();
    }
  }, [user, refreshProfile]);
  
  // Fetch transactions from Supabase
  const { data: transactions = [], isLoading, refetch } = useQuery({
    queryKey: ['pointsHistory', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('data', { ascending: false });
      
      if (error) {
        console.error('Error fetching points history:', error);
        return [];
      }
      
      console.log('Fetched transactions:', data);
      return data as Transaction[];
    },
    enabled: !!user
  });
  
  // Debug logging for transactions with tipo = 'resgate'
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      const resgates = transactions.filter(t => t.tipo === 'resgate');
      console.log('Redemption transactions found:', resgates.length, resgates);
    }
  }, [transactions]);
  
  // Apply filters
  let filteredTransactions = [...transactions];
  
  // Apply type filter (ganho/resgate)
  if (typeFilter === "ganho") {
    filteredTransactions = filteredTransactions.filter(t => t.pontos > 0);
  } else if (typeFilter === "resgate") {
    filteredTransactions = filteredTransactions.filter(t => t.pontos < 0);
  }
  
  // Apply origin filter
  if (originFilter !== "todos") {
    filteredTransactions = filteredTransactions.filter(t => t.tipo === originFilter);
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
  
  // Calculate total points from profile
  const totalPoints = profile?.saldo_pontos || 0;
  
  // Calculate points statistics
  const totalEarned = transactions
    .filter(t => t.pontos > 0)
    .reduce((sum, t) => sum + t.pontos, 0);
    
  const totalRedeemed = transactions
    .filter(t => t.pontos < 0)
    .reduce((sum, t) => sum + Math.abs(t.pontos), 0);
  
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
      case 'servico':
        return <Briefcase size={18} className="text-orange-600" />;
      default:
        return <CircleDollarSign size={18} className="text-gray-600" />;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Format transaction description with reference id if available
  const formatDescription = (transaction: Transaction) => {
    // For redemption transactions, leave as is since they already mention what was redeemed
    if (transaction.tipo === 'resgate') {
      return transaction.descricao;
    }
    
    // For purchases, add reference id as a code if available
    if (transaction.referencia_id && transaction.tipo === 'compra') {
      return (
        <div>
          {transaction.descricao}
          <div className="text-xs text-gray-500">#{transaction.referencia_id.substring(0, 8)}</div>
        </div>
      );
    }
    
    return transaction.descricao;
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
          
          <Separator className="my-3" />
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Total ganho</p>
              <p className="font-medium text-green-600">+{totalEarned} pontos</p>
            </div>
            <div>
              <p className="text-gray-500">Total resgatado</p>
              <p className="font-medium text-red-600">-{totalRedeemed} pontos</p>
            </div>
          </div>
          
          {/* Botão para atualizar dados */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              refreshProfile();
              refetch();
              toast.success('Dados atualizados');
            }}
            className="w-full mt-3 flex items-center justify-center"
          >
            <RefreshCw size={14} className="mr-2" />
            Atualizar saldo e transações
          </Button>
        </Card>
      </div>
      
      {/* Filters */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium">Extrato de pontos</h2>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={14} className="mr-1" />
            Filtros
          </Button>
        </div>
        
        {showFilters && (
          <div className="bg-gray-50 p-3 rounded-md mb-4 space-y-3">
            <div className="flex gap-3 mb-1">
              <Select defaultValue="todos" onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="ganho">Ganhos</SelectItem>
                  <SelectItem value="resgate">Resgates</SelectItem>
                </SelectContent>
              </Select>
              
              <Select defaultValue="todos" onValueChange={setOriginFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas origens</SelectItem>
                  <SelectItem value="compra">Compras app</SelectItem>
                  <SelectItem value="loja-fisica">Compras físicas</SelectItem>
                  <SelectItem value="servico">Serviços</SelectItem>
                  <SelectItem value="indicacao">Indicações</SelectItem>
                  <SelectItem value="resgate">Resgates</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
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
        )}
        
        {/* Transactions */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-construPro-blue"></div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-10">
              <CircleDollarSign className="mx-auto text-gray-400 mb-3" size={40} />
              <h3 className="text-lg font-medium text-gray-700">Nenhuma transação encontrada</h3>
              <p className="text-gray-500 mt-1">Não há transações com os filtros selecionados</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex">
                      {getTransactionIcon(transaction.tipo)}
                      <div className="ml-3">
                        <p className="font-medium">{formatDescription(transaction)}</p>
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
