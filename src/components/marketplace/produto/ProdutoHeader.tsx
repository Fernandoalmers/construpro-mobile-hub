
import React from 'react';
import { ArrowLeft, Share2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface ProdutoHeaderProps {
  productName?: string;
  onFavoriteClick?: () => void;
  isFavorited?: boolean;
}

export const ProdutoHeader: React.FC<ProdutoHeaderProps> = ({
  productName = "Produto",
  onFavoriteClick,
  isFavorited = false
}) => {
  const navigate = useNavigate();

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: productName,
        url: window.location.href,
      });
    } else {
      // Fallback para copiar URL
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="bg-black py-4 px-4 shadow-sm">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} />
        </Button>
        
        <h1 className="text-lg font-semibold text-white truncate mx-3 flex-1 text-center">
          {productName}
        </h1>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={handleShare}
          >
            <Share2 size={18} />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={onFavoriteClick}
          >
            <Heart 
              size={18} 
              className={isFavorited ? 'fill-red-500 text-red-500' : 'text-white'} 
            />
          </Button>
        </div>
      </div>
    </div>
  );
};
