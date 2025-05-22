
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
  images?: string[] | Array<{url?: string, path?: string, src?: string}>;
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
  // Process the images to handle various formats
  const processImages = React.useMemo(() => {
    const result: string[] = [];
    
    // Add main image if it's a valid URL
    if (mainImage && typeof mainImage === 'string' && mainImage.trim() !== '') {
      result.push(mainImage);
    }
    
    // Process additional images
    if (images) {
      if (Array.isArray(images)) {
        images.forEach(img => {
          if (typeof img === 'string') {
            // If image is a string, add it directly (with proper type checking)
            // Fix: Use optional chaining to safely access trim method
            if (typeof img === 'string' && img?.trim() !== '' && !result.includes(img)) {
              result.push(img);
            }
          } else if (img && typeof img === 'object') {
            // If image is an object, try to extract URL from common fields
            const imgUrl = img.url || img.path || img.src;
            // Fix: Add type guard before calling trim method
            if (imgUrl && typeof imgUrl === 'string' && imgUrl.trim() !== '' && !result.includes(imgUrl)) {
              result.push(imgUrl);
            }
          }
        });
      } else if (typeof images === 'string' && images.trim() !== '' && !result.includes(images)) {
        // If images prop is a string instead of array
        result.push(images);
      }
    }

    console.log(`[ProductImageGallery] Processed ${result.length} images for "${productName}"`);
    return result;
  }, [mainImage, images, productName]);
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Handle thumbnail click
  const handleThumbnailClick = (index: number) => {
    setCurrentImageIndex(index);
  };

  // Handle next/previous buttons
  const handlePrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? processImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) => (prev === processImages.length - 1 ? 0 : prev + 1));
  };

  if (processImages.length === 0) {
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
          {processImages.map((imageUrl, index) => (
            <CarouselItem key={index} className="flex justify-center">
              <div className="aspect-square relative w-full">
                <img
                  src={imageUrl || 'https://via.placeholder.com/400?text=Indisponível'}
                  alt={`${productName} - imagem ${index + 1}`}
                  className="w-full h-full object-contain rounded-md"
                  onError={(e) => {
                    console.error(`Error loading image ${index}:`, imageUrl);
                    e.currentTarget.src = 'https://via.placeholder.com/400?text=Erro';
                  }}
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
      {processImages.length > 1 && (
        <div className="flex mt-4 gap-2 overflow-x-auto pb-2 justify-center">
          {processImages.map((imageUrl, index) => (
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
                src={imageUrl || 'https://via.placeholder.com/150?text=Indisponível'} 
                alt={`${productName} - miniatura ${index + 1}`} 
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/150?text=Erro';
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;
