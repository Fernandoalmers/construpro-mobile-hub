import React, { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { ProductSegment } from '@/services/admin/productSegmentsService';
import { getSegmentGradient } from '@/hooks/useMarketplaceSegments';

interface SegmentCardProps {
  segment: ProductSegment;
  onClick: () => void;
}

const SegmentCard: React.FC<SegmentCardProps> = ({ segment, onClick }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const gradientClass = getSegmentGradient(segment.nome);

  const handleImageError = () => {
    console.log(`🖼️ [SegmentCard] Erro ao carregar imagem para ${segment.nome}`);
    setImageError(true);
  };

  const handleImageLoad = () => {
    console.log(`✅ [SegmentCard] Imagem carregada para ${segment.nome}`);
    setImageLoaded(true);
  };

  return (
    <div 
      className="cursor-pointer transform transition-transform duration-200 hover:scale-105" 
      onClick={onClick}
    >
      <div className="relative h-40 rounded-lg overflow-hidden shadow-md bg-gray-200">
        {/* Background gradient sempre visível como base */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass}`} />
        
        {/* Imagem com overlay progressivo */}
        {segment.image_url && !imageError && (
          <>
            <img
              src={segment.image_url}
              alt={`Categoria ${segment.nome}`}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              loading="eager" // Carregamento prioritário
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
            {/* Overlay escuro para legibilidade */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </>
        )}
        
        {/* Ícone central para fallback visual */}
        {(!segment.image_url || imageError) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-6xl opacity-20">
              <ShoppingBag size={60} />
            </div>
          </div>
        )}
        
        {/* Content sempre visível */}
        <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col items-start z-10">
          <div className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center mb-2 shadow-lg">
            <span className="text-construPro-blue">
              <ShoppingBag size={24} />
            </span>
          </div>
          <span className="text-white font-medium text-sm drop-shadow-md">
            {segment.nome}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SegmentCard;