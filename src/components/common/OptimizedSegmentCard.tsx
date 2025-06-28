
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface OptimizedSegmentCardProps {
  id: string;
  title: string;
  imageUrl?: string | null;
  icon: React.ReactNode;
  onClick: (segmentId: string) => void;
  isSelected?: boolean;
  showSkeleton?: boolean;
  className?: string;
}

const OptimizedSegmentCard: React.FC<OptimizedSegmentCardProps> = ({
  id,
  title,
  imageUrl,
  icon,
  onClick,
  isSelected = false,
  showSkeleton = false,
  className = ''
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  // Fallback images para segmentos sem imagem no banco
  const getFallbackImage = (segmentName: string) => {
    const nameToLower = segmentName.toLowerCase();
    if (nameToLower.includes('material') && nameToLower.includes('constru')) {
      return '/lovable-uploads/1b629f74-0778-46a1-bb6a-4c30301e733e.png';
    } else if (nameToLower.includes('elétri') || nameToLower.includes('eletri')) {
      return 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=300';
    } else if (nameToLower.includes('vidro') || nameToLower.includes('vidraç')) {
      return 'https://images.unsplash.com/photo-1496307653780-42ee777d4833?auto=format&fit=crop&w=300';
    } else if (nameToLower.includes('marmor')) {
      return 'https://images.unsplash.com/photo-1466442929976-97f336a657be?auto=format&fit=crop&w=300';
    } else if (nameToLower.includes('aluguel') || nameToLower.includes('equipamento')) {
      return 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=300';
    } else if (nameToLower.includes('profissional') || nameToLower.includes('serviço')) {
      return 'https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=300';
    }
    return null;
  };

  // Determinar qual URL usar
  useEffect(() => {
    const urlToUse = imageUrl || getFallbackImage(title);
    if (urlToUse !== currentImageUrl) {
      console.log('🖼️ [OptimizedSegmentCard] Atualizando src para', title, ':', urlToUse);
      setCurrentImageUrl(urlToUse);
      setIsLoaded(false);
      setHasError(false);
    }
  }, [imageUrl, title, currentImageUrl]);

  const handleLoad = () => {
    console.log('✅ [OptimizedSegmentCard] Imagem carregada para', title, ':', currentImageUrl);
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    console.log('❌ [OptimizedSegmentCard] Erro ao carregar imagem para', title, ':', currentImageUrl);
    setHasError(true);
    setIsLoaded(false);
  };

  const shouldShowImage = currentImageUrl && !hasError;
  const shouldShowSkeleton = showSkeleton || (!isLoaded && !hasError && shouldShowImage);

  return (
    <div 
      className={cn(
        "flex flex-col items-center p-3 rounded-lg cursor-pointer transition-all min-w-[80px]", 
        isSelected ? "bg-construPro-blue text-white" : "bg-white hover:bg-gray-50",
        className
      )} 
      onClick={() => onClick(id)}
    >
      <div className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center mb-2 overflow-hidden", 
        isSelected ? "bg-white text-construPro-blue" : "bg-construPro-blue/10 text-construPro-blue"
      )}>
        {shouldShowSkeleton ? (
          <Skeleton className="w-full h-full rounded-full" />
        ) : shouldShowImage ? (
          <img 
            src={currentImageUrl} 
            alt={`Imagem do segmento ${title}`} 
            className={cn(
              "w-full h-full object-cover rounded-full transition-opacity duration-300",
              isLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={handleLoad}
            onError={handleError}
            loading="eager"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            {icon}
          </div>
        )}
      </div>
      <span className="text-xs font-medium text-center">{title}</span>
    </div>
  );
};

export default OptimizedSegmentCard;
