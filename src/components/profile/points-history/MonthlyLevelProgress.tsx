
import React from 'react';
import Card from '../../common/Card';
import ProgressBar from '../../common/ProgressBar';
import { LevelInfo, LEVEL_MAP } from '@/utils/pointsCalculations';

interface MonthlyLevelProgressProps {
  currentMonth: string;
  levelInfo: LevelInfo;
}

const MonthlyLevelProgress: React.FC<MonthlyLevelProgressProps> = ({
  currentMonth,
  levelInfo,
}) => {
  // Calculate the percentage for display
  const percentage = Math.round((levelInfo.currentProgress / levelInfo.maxProgress) * 100);
  
  // Get the next level name in Portuguese
  const nextLevelName = levelInfo.nextLevel 
    ? LEVEL_MAP[levelInfo.nextLevel as keyof typeof LEVEL_MAP]?.name 
    : '';
  
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
      
      <div className="relative">
        <ProgressBar 
          value={levelInfo.currentProgress} 
          max={levelInfo.maxProgress}
          size="md"
          customColorClass="bg-amber-500"
        />
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>{percentage}%</span>
          <span>{levelInfo.currentProgress}/{levelInfo.maxProgress}</span>
        </div>
      </div>
      
      <p className="text-xs text-gray-500 mt-1 text-center">
        {levelInfo.nextLevel 
          ? `Faltam ${levelInfo.pointsToNextLevel} pontos para o nível ${nextLevelName}` 
          : 'Nível máximo do mês atingido!'}
      </p>
    </Card>
  );
};

export default MonthlyLevelProgress;
