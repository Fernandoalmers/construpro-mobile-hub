
import React from 'react';
import Card from '../../common/Card';
import ProgressBar from '../../common/ProgressBar';
import { LevelInfo } from '@/utils/pointsCalculations';

interface MonthlyLevelProgressProps {
  currentMonth: string;
  levelInfo: LevelInfo;
}

const MonthlyLevelProgress: React.FC<MonthlyLevelProgressProps> = ({
  currentMonth,
  levelInfo,
}) => {
  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm text-gray-600">
          Nível do mês de {currentMonth}
        </h3>
        <span 
          className="font-bold"
          style={{ color: levelInfo.levelColor }}
        >
          {levelInfo.levelName}
        </span>
      </div>
      
      <ProgressBar 
        value={levelInfo.currentProgress} 
        max={levelInfo.maxProgress} 
        size="md"
        color="blue"
        animated={true}
      />
      
      <p className="text-xs text-gray-500 mt-1 text-center">
        {levelInfo.nextLevel 
          ? `Faltam ${levelInfo.pointsToNextLevel} pontos para o nível ${
              levelInfo.nextLevel.charAt(0).toUpperCase() + levelInfo.nextLevel.slice(1)
            }` 
          : 'Nível máximo do mês atingido!'}
      </p>
    </Card>
  );
};

export default MonthlyLevelProgress;
