
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Award, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PointsBalanceCardProps {
  userPoints: number;
  currentLevel: {
    name: string;
    color: string;
  };
  levelProgress: number;
  pointsToNextLevel: number;
  nextLevelName: string | null;
  monthlyPoints: number;
  currentMonth: string;
  hasTransactions: boolean;
  isLoading: boolean;
}

const PointsBalanceCard: React.FC<PointsBalanceCardProps> = ({
  userPoints,
  currentLevel,
  levelProgress,
  pointsToNextLevel,
  nextLevelName,
  monthlyPoints,
  currentMonth,
  hasTransactions,
  isLoading
}) => {
  const navigate = useNavigate();

  return (
    <Card className="mb-4 bg-gradient-to-r from-royal-blue to-royal-blue/80 text-white">
      <CardContent className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-32 bg-white/20" />
            <Skeleton className="h-6 w-48 bg-white/20" />
            <Skeleton className="h-2 w-full bg-white/20" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-white/80 text-xs mb-1">Seu saldo</p>
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5" />
                  <span className="text-xl font-bold">
                    {userPoints.toLocaleString()} pontos
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/80 text-xs mb-1">Nível</p>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${currentLevel.color}`}></div>
                  <span className="font-medium text-sm">{currentLevel.name}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/profile/points-history')}
                className="text-white hover:bg-white/10 p-1 h-auto text-xs"
              >
                Ver extrato <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>

            {/* Level progress */}
            {nextLevelName && pointsToNextLevel > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-white/80 mb-1">
                  <span>Nível {currentMonth}: {nextLevelName}</span>
                  <span>{pointsToNextLevel} pontos restantes</span>
                </div>
                <Progress value={levelProgress} className="h-1 bg-white/20" />
              </div>
            )}

            {/* Monthly points info */}
            {hasTransactions && (
              <div className="mt-2 text-center">
                <p className="text-white/80 text-xs">
                  {monthlyPoints} pontos conquistados em {currentMonth}
                </p>
              </div>
            )}

            {/* First purchase message */}
            {!hasTransactions && (
              <div className="mt-3 text-center">
                <p className="text-white/80 text-xs">
                  Faça sua primeira compra para começar a ganhar pontos!
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PointsBalanceCard;
