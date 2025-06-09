
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown } from 'lucide-react';
import { PointsTransaction } from '@/services/admin/loyaltyService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RecentTransactionsTableProps {
  transactions: PointsTransaction[];
  isLoading: boolean;
}

const RecentTransactionsTable: React.FC<RecentTransactionsTableProps> = ({ transactions, isLoading }) => {
  const getTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'compra': return 'bg-green-100 text-green-800';
      case 'resgate': return 'bg-red-100 text-red-800';
      case 'indicacao': return 'bg-blue-100 text-blue-800';
      case 'servico': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPoints = (pontos: number) => {
    const isPositive = pontos > 0;
    return (
      <span className={isPositive ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
        {isPositive ? '+' : ''}{pontos.toLocaleString()}
      </span>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUpDown className="h-5 w-5" />
          Transações Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Pontos</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{transaction.user_name}</div>
                    <div className="text-sm text-gray-500">{transaction.user_email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getTypeColor(transaction.tipo)}>
                    {transaction.tipo}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs truncate" title={transaction.descricao}>
                    {transaction.descricao}
                  </div>
                  {transaction.reference_code && (
                    <div className="text-xs text-gray-500">
                      Ref: {transaction.reference_code}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {formatPoints(transaction.pontos)}
                </TableCell>
                <TableCell>
                  {format(new Date(transaction.data), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RecentTransactionsTable;
