
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { ArrowRight, ShoppingBag, Gift, Percent } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CarouselCard {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  buttonText: string;
  buttonAction: () => void;
  icon?: React.ReactNode;
  gradient: string;
}

const FeaturedCarouselSection: React.FC = () => {
  const navigate = useNavigate();

  const carouselCards: CarouselCard[] = [
    {
      id: '1',
      title: 'Ofertas Especiais',
      subtitle: 'Descubra produtos com descontos incríveis',
      image: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=300&fit=crop',
      buttonText: 'Ver Ofertas',
      buttonAction: () => navigate('/marketplace'),
      icon: <Percent className="h-5 w-5" />,
      gradient: 'from-orange-500/80 to-red-600/80'
    },
    {
      id: '2',
      title: 'Produtos Populares',
      subtitle: 'Os mais vendidos da semana',
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop',
      buttonText: 'Explorar',
      buttonAction: () => navigate('/marketplace'),
      icon: <ShoppingBag className="h-5 w-5" />,
      gradient: 'from-blue-500/80 to-purple-600/80'
    },
    {
      id: '3',
      title: 'Novidades',
      subtitle: 'Produtos recém-chegados para você',
      image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=300&fit=crop',
      buttonText: 'Descobrir',
      buttonAction: () => navigate('/marketplace'),
      icon: <Gift className="h-5 w-5" />,
      gradient: 'from-green-500/80 to-teal-600/80'
    },
    {
      id: '4',
      title: 'Tecnologia',
      subtitle: 'Inovação que transforma seu dia',
      image: 'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=400&h=300&fit=crop',
      buttonText: 'Ver Mais',
      buttonAction: () => navigate('/marketplace'),
      icon: <ArrowRight className="h-5 w-5" />,
      gradient: 'from-indigo-500/80 to-blue-600/80'
    }
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900">Destaques</h3>
      </div>
      
      {/* Mobile: Carousel - Hidden on desktop */}
      <div className="block md:hidden">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2">
            {carouselCards.map((card) => (
              <CarouselItem key={card.id} className="pl-2 basis-full sm:basis-1/2">
                <Card className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-0 relative h-48">
                    {/* Background Image */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                      style={{ backgroundImage: `url(${card.image})` }}
                    />
                    
                    {/* Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient}`} />
                    
                    {/* Content */}
                    <div className="relative h-full flex flex-col justify-between p-4 text-white">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold mb-1 leading-tight">
                            {card.title}
                          </h4>
                          <p className="text-sm opacity-90 leading-snug">
                            {card.subtitle}
                          </p>
                        </div>
                        {card.icon && (
                          <div className="ml-2 opacity-80">
                            {card.icon}
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4">
                        <Button
                          onClick={card.buttonAction}
                          variant="secondary"
                          size="sm"
                          className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm transition-all duration-200"
                        >
                          {card.buttonText}
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex -left-4" />
          <CarouselNext className="hidden sm:flex -right-4" />
        </Carousel>
      </div>

      {/* Desktop: Grid layout - Hidden on mobile */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4">
        {carouselCards.map((card) => (
          <Card key={card.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300">
            <CardContent className="p-0 relative h-48">
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                style={{ backgroundImage: `url(${card.image})` }}
              />
              
              {/* Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient}`} />
              
              {/* Content */}
              <div className="relative h-full flex flex-col justify-between p-4 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-bold mb-1 leading-tight">
                      {card.title}
                    </h4>
                    <p className="text-sm opacity-90 leading-snug">
                      {card.subtitle}
                    </p>
                  </div>
                  {card.icon && (
                    <div className="ml-2 opacity-80">
                      {card.icon}
                    </div>
                  )}
                </div>
                
                <div className="mt-4">
                  <Button
                    onClick={card.buttonAction}
                    variant="secondary"
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm transition-all duration-200"
                  >
                    {card.buttonText}
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FeaturedCarouselSection;
