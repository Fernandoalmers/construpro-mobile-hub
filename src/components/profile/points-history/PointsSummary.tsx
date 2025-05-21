
import React from 'react';
import Card from '../../common/Card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { CircleDollarSign, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface PointsSummaryProps {
  totalPoints: number;
  totalEarned: number;
  totalRedeemed: number;
  onRefresh: () => void;
}

const PointsSummary: React.FC<PointsSummaryProps> = ({
  totalPoints,
  totalEarned,
  totalRedeemed,
  onRefresh,
}) => {
  return (
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
      
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => {
          onRefresh();
          toast.success('Dados atualizados');
        }}
        className="w-full mt-3 flex items-center justify-center"
      >
        <RefreshCw size={14} className="mr-2" />
        Atualizar saldo e transações
      </Button>
    </Card>
  );
};

export default PointsSummary;
