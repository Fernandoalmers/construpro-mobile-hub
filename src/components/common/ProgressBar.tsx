
import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max: number;
  showLabel?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'default' | 'orange' | 'blue' | 'green';
  className?: string;
  animated?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  showLabel = false,
  label,
  size = 'md',
  color = 'default',
  className,
  animated = false,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const sizeClassMap = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const colorClassMap = {
    default: 'bg-construPro-blue',
    orange: 'bg-construPro-orange',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
  };

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>{label || `${Math.round(percentage)}%`}</span>
          {showLabel && <span>{value}/{max}</span>}
        </div>
      )}
      <div className={cn("w-full bg-gray-200 rounded-full overflow-hidden", sizeClassMap[size], className)}>
        <div
          className={cn(
            "rounded-full transition-all duration-1000 ease-out", 
            colorClassMap[color],
            animated && "animate-pulse-subtle"
          )}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
