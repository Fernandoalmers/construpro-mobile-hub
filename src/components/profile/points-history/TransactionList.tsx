import React from 'react';
import Card from '../../common/Card';
import { CircleDollarSign, ShoppingBag, Gift, Users, Receipt, Briefcase } from 'lucide-react';
import { Transaction } from '@/utils/pointsCalculations';

interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, isLoading }) => {
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
    let shortDescription;
    
    // For purchases, format the description more concisely
    if (transaction.tipo === 'compra') {
      shortDescription = 'Pontos por compra';
      
      // If we have a reference ID, show only the first 8 chars
      if (transaction.referencia_id) {
        const shortId = transaction.referencia_id.substring(0, 8);
        return (
          <div>
            {shortDescription}
            <div className="text-xs text-gray-500">#{shortId}</div>
          </div>
        );
      }
      return shortDescription;
    }
    
    // For redemptions, keep description brief
    if (transaction.tipo === 'resgate') {
      return transaction.descricao;
    }
    
    // For all other types, keep it simple with basic type info
    return transaction.descricao || `Transação de ${transaction.tipo}`;
  };

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-construPro-blue"></div>
        </div>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="overflow-hidden">
        <div className="text-center py-10">
          <CircleDollarSign className="mx-auto text-gray-400 mb-3" size={40} />
          <h3 className="text-lg font-medium text-gray-700">Nenhuma transação encontrada</h3>
          <p className="text-gray-500 mt-1">Não há transações com os filtros selecionados</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="divide-y divide-gray-100">
        {transactions.map((transaction) => (
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
    </Card>
  );
};

export default TransactionList;
