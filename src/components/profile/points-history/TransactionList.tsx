
import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Plus, Minus, Gift, ShoppingCart, Settings, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { createSamplePointsTransactions } from '@/services/sampleDataService';
import { toast } from '@/components/ui/sonner';
import LoadingState from '@/components/common/LoadingState';

interface Transaction {
  id: string;
  pontos: number;
  tipo: string;
  descricao: string;
  data: string;
  reference_code?: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, isLoading }) => {
  const { user } = useAuth();
  const [isCreatingSamples, setIsCreatingSamples] = useState(false);

  const handleCreateSampleData = async () => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    console.log('🔄 [TransactionList] Creating sample data for user:', user.id);
    setIsCreatingSamples(true);

    try {
      const success = await createSamplePointsTransactions(user.id);
      if (success) {
        toast.success('Dados de exemplo criados com sucesso!');
        window.location.reload(); // Recarregar a página para mostrar os novos dados
      } else {
        toast.error('Erro ao criar dados de exemplo');
      }
    } catch (error) {
      console.error('❌ [TransactionList] Error creating sample data:', error);
      toast.error('Erro ao criar dados de exemplo');
    } finally {
      setIsCreatingSamples(false);
    }
  };

  const getTransactionIcon = (tipo: string, pontos: number) => {
    if (pontos > 0) {
      switch (tipo) {
        case 'compra':
          return <ShoppingCart className="h-5 w-5 text-green-600" />;
        case 'servico':
          return <Settings className="h-5 w-5 text-blue-600" />;
        default:
          return <Plus className="h-5 w-5 text-green-600" />;
      }
    } else {
      switch (tipo) {
        case 'resgate':
          return <Gift className="h-5 w-5 text-red-600" />;
        default:
          return <Minus className="h-5 w-5 text-red-600" />;
      }
    }
  };

  const getTransactionColor = (pontos: number) => {
    return pontos > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getTypeLabel = (tipo: string) => {
    switch (tipo) {
      case 'compra':
        return 'Compra';
      case 'resgate':
        return 'Resgate';
      case 'servico':
        return 'Serviço';
      default:
        return tipo;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Data inválida';
    }
  };

  if (isLoading) {
    return <LoadingState text="Carregando transações..." />;
  }

  if (transactions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <Calendar className="h-8 w-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhuma transação encontrada
            </h3>
            <p className="text-gray-600 mb-4">
              Suas transações de pontos aparecerão aqui
            </p>
            <Button 
              onClick={handleCreateSampleData}
              disabled={isCreatingSamples}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {isCreatingSamples ? 'Criando...' : 'Criar dados de exemplo'}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Histórico de Transações
        </h3>
        <Badge variant="outline">
          {transactions.length} transaç{transactions.length !== 1 ? 'ões' : 'ão'}
        </Badge>
      </div>
      
      <div className="space-y-3">
        {transactions.map((transaction) => (
          <Card key={transaction.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getTransactionIcon(transaction.tipo, transaction.pontos)}
                  <div>
                    <p className="font-medium text-gray-900">
                      {transaction.descricao}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{getTypeLabel(transaction.tipo)}</span>
                      <span>•</span>
                      <span>{formatDate(transaction.data)}</span>
                      {transaction.reference_code && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-xs">
                            {transaction.reference_code}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className={`text-right ${getTransactionColor(transaction.pontos)}`}>
                  <p className="font-bold text-lg">
                    {transaction.pontos > 0 ? '+' : ''}{transaction.pontos}
                  </p>
                  <p className="text-xs text-gray-500">
                    {transaction.pontos > 0 ? 'ganhos' : 'gastos'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TransactionList;
