
import React from 'react';

interface PointsDisplayProps {
  pontos: number;
  pontos_profissional?: number;
}

const PointsDisplay: React.FC<PointsDisplayProps> = ({ pontos, pontos_profissional }) => {
  return (
    <div className="flex flex-col">
      <span className="font-medium">{pontos}</span>
      {pontos_profissional && pontos_profissional !== pontos && (
        <span className="text-xs text-gray-500">Prof: {pontos_profissional}</span>
      )}
    </div>
  );
};

export default PointsDisplay;
