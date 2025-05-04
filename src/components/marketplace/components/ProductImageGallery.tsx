
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

interface ProductImageGalleryProps {
  mainImage: string;
  images?: string[];
  productName: string;
  hasDiscount: boolean;
  discountPercentage?: number;
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  mainImage,
  images = [],
  productName,
  hasDiscount,
  discountPercentage
}) => {
  // Combine main image and additional images
  const allImages = mainImage ? [mainImage, ...(images || []).filter(img => img !== mainImage)] : images || [];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Handle thumbnail click
  const handleThumbnailClick = (index: number) => {
    setCurrentImageIndex(index);
  };

  // Handle next/previous buttons
  const handlePrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  if (allImages.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="aspect-square relative bg-gray-100 rounded-md flex items-center justify-center">
          <span className="text-gray-400">Sem imagem disponível</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      {/* Main carousel */}
      <Carousel className="w-full">
        <CarouselContent>
          {allImages.map((image, index) => (
            <CarouselItem key={index} className="flex justify-center">
              <div className="aspect-square relative w-full">
                <img
                  src={image || 'https://via.placeholder.com/400'}
                  alt={`${productName} - imagem ${index + 1}`}
                  className="w-full h-full object-contain rounded-md"
                />
                {hasDiscount && discountPercentage && index === 0 && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold rounded-md px-2 py-1">
                    {discountPercentage}% OFF
                  </div>
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2" />
        <CarouselNext className="right-2" />
      </Carousel>

      {/* Image thumbnails */}
      {allImages.length > 1 && (
        <div className="flex mt-4 gap-2 overflow-x-auto pb-2 justify-center">
          {allImages.map((url, index) => (
            <div 
              key={index} 
              className={cn(
                "w-16 h-16 border rounded-md overflow-hidden flex-shrink-0 cursor-pointer transition-all",
                currentImageIndex === index 
                  ? "border-blue-500 ring-2 ring-blue-300" 
                  : "border-gray-200 hover:border-blue-300"
              )}
              onClick={() => handleThumbnailClick(index)}
            >
              <img 
                src={url} 
                alt={`${productName} - miniatura ${index + 1}`} 
                className="w-full h-full object-contain" 
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;
