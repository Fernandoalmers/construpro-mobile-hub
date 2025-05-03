
import React from 'react';

interface PointsDisplayProps {
  pontos: number;
  pontos_profissional?: number;
  pontos_consumidor?: number;
}

const PointsDisplay: React.FC<PointsDisplayProps> = ({ 
  pontos, 
  pontos_profissional, 
  pontos_consumidor 
}) => {
  // Use specific consumer points if available, otherwise fall back to generic points
  const consumerPoints = pontos_consumidor !== undefined ? pontos_consumidor : pontos;
  const professionalPoints = pontos_profissional !== undefined ? pontos_profissional : pontos;
  
  return (
    <div className="flex flex-col">
      <span className="font-medium">{consumerPoints}</span>
      {professionalPoints !== undefined && professionalPoints !== consumerPoints && (
        <span className="text-xs text-gray-500">Prof: {professionalPoints}</span>
      )}
    </div>
  );
};

export default PointsDisplay;
