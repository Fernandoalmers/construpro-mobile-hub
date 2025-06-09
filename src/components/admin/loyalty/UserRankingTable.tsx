
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Calendar } from 'lucide-react';
import { UserRanking } from '@/services/admin/loyaltyService';
import { getCurrentMonthName } from '@/utils/pointsCalculations';

interface UserRankingTableProps {
  users: UserRanking[];
  isLoading: boolean;
}

const UserRankingTable: React.FC<UserRankingTableProps> = ({ users, isLoading }) => {
  const currentMonth = getCurrentMonthName();

  const getLevelIcon = (nivel: string, position: number) => {
    if (position === 0) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (position === 1) return <Medal className="h-4 w-4 text-gray-400" />;
    if (position === 2) return <Award className="h-4 w-4 text-orange-500" />;
    return null;
  };

  const getLevelColor = (nivel: string) => {
    switch (nivel) {
      case 'Ouro': return 'bg-yellow-100 text-yellow-800';
      case 'Prata': return 'bg-gray-100 text-gray-800';
      case 'Bronze': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ranking de Usuários</CardTitle>
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
          <Trophy className="h-5 w-5 text-yellow-500" />
          Ranking de Usuários
          <Badge variant="outline" className="ml-2 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {currentMonth}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Nível</TableHead>
              <TableHead className="text-right">Pontos {currentMonth}</TableHead>
              <TableHead className="text-right">Total Pontos</TableHead>
              <TableHead className="text-right">Transações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user, index) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {getLevelIcon(user.nivel, index)}
                    {index + 1}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{user.nome}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getLevelColor(user.nivel)}>
                    {user.nivel}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-bold text-blue-600">
                  {user.pontos_mensais.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {user.saldo_pontos.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {user.total_transacoes}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default UserRankingTable;
