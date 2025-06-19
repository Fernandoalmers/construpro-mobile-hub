
import React from 'react';
import { Clock, Flame } from 'lucide-react';
import { useOfferCountdown } from '@/hooks/useOfferCountdown';

interface OfferCountdownProps {
  endDate: string | null;
  isActive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'compact' | 'full';
  className?: string;
}

const OfferCountdown: React.FC<OfferCountdownProps> = ({
  endDate,
  isActive = true,
  size = 'md',
  variant = 'compact',
  className = ''
}) => {
  const countdown = useOfferCountdown(endDate, isActive);

  if (!countdown.isActive || countdown.isExpired) {
    return null;
  }

  const isUrgent = countdown.days === 0 && countdown.hours < 6;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  };

  if (variant === 'compact') {
    // PADRONIZADO: Sempre exibir no formato "Xd Yh Zm Ws" com todas as unidades quando aplicável
    let timeDisplay = '';
    
    if (countdown.days > 0) {
      timeDisplay = `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m ${countdown.seconds}s`;
    } else if (countdown.hours > 0) {
      timeDisplay = `${countdown.hours}h ${countdown.minutes}m ${countdown.seconds}s`;
    } else {
      timeDisplay = `${countdown.minutes}m ${countdown.seconds}s`;
    }

    return (
      <div className={`inline-flex items-center gap-1 bg-red-500 text-white rounded-full ${sizeClasses[size]} font-medium ${isUrgent ? 'animate-pulse' : ''} ${className}`}>
        <Flame size={iconSizes[size]} />
        <span>{timeDisplay}</span>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg p-3 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Flame size={16} className={isUrgent ? 'animate-bounce' : ''} />
        <span className="font-bold text-sm">OFERTA RELÂMPAGO</span>
      </div>
      
      <div className="flex items-center gap-1 text-xs">
        <Clock size={12} />
        <span>Termina em:</span>
      </div>
      
      <div className="flex items-center gap-2 mt-1">
        {countdown.days > 0 && (
          <div className="text-center">
            <div className="font-bold text-lg">{countdown.days}</div>
            <div className="text-xs opacity-90">dia{countdown.days !== 1 ? 's' : ''}</div>
          </div>
        )}
        {(countdown.days > 0 || countdown.hours > 0) && (
          <>
            {countdown.days > 0 && <span className="text-white/60">:</span>}
            <div className="text-center">
              <div className="font-bold text-lg">{countdown.hours.toString().padStart(2, '0')}</div>
              <div className="text-xs opacity-90">hrs</div>
            </div>
          </>
        )}
        <span className="text-white/60">:</span>
        <div className="text-center">
          <div className="font-bold text-lg">{countdown.minutes.toString().padStart(2, '0')}</div>
          <div className="text-xs opacity-90">min</div>
        </div>
        <span className="text-white/60">:</span>
        <div className="text-center">
          <div className="font-bold text-lg">{countdown.seconds.toString().padStart(2, '0')}</div>
          <div className="text-xs opacity-90">seg</div>
        </div>
      </div>
    </div>
  );
};

export default OfferCountdown;
