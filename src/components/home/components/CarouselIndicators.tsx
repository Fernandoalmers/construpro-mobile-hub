
import React from 'react';
import { type CarouselApi } from '@/components/ui/carousel';

interface CarouselIndicatorsProps {
  api: CarouselApi | undefined;
  totalSlides: number;
  currentSlide: number;
  onSlideSelect: (index: number) => void;
}

const CarouselIndicators: React.FC<CarouselIndicatorsProps> = ({
  api,
  totalSlides,
  currentSlide,
  onSlideSelect
}) => {
  if (!api || totalSlides <= 1) return null;

  return (
    <div className="flex justify-center gap-2 mt-4">
      {Array.from({ length: totalSlides }).map((_, index) => (
        <button
          key={index}
          onClick={() => onSlideSelect(index)}
          className={`w-2 h-2 rounded-full transition-all duration-200 ${
            index === currentSlide
              ? 'bg-construPro-blue scale-125'
              : 'bg-gray-300 hover:bg-gray-400'
          }`}
          aria-label={`Ir para slide ${index + 1}`}
        />
      ))}
    </div>
  );
};

export default CarouselIndicators;
