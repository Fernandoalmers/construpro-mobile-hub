
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface OnboardingSlideProps {
  title: string;
  description: string;
  imageUrl: string;
}

const OnboardingSlide: React.FC<OnboardingSlideProps> = ({ title, description, imageUrl }) => {
  return (
    <div className="flex flex-col items-center px-6 h-full">
      <div className="mb-12 mt-16 h-64 w-64 bg-white rounded-full overflow-hidden flex items-center justify-center">
        <img src={imageUrl} alt={title} className="w-3/4 h-3/4 object-contain" />
      </div>
      <h2 className="text-2xl font-bold text-construPro-blue mb-4">{title}</h2>
      <p className="text-center text-gray-600 mb-10">{description}</p>
    </div>
  );
};

const OnboardingScreen: React.FC = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: OnboardingSlideProps[] = [
    {
      title: "Acumule Pontos",
      description: "Ganhe pontos em todas as suas compras nas lojas parceiras e troque por recompensas exclusivas.",
      imageUrl: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80"
    },
    {
      title: "Marketplace Completo",
      description: "Encontre tudo para sua obra em um só lugar. Compre de diversas lojas e acumule pontos.",
      imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80"
    },
    {
      title: "Chat com Lojistas",
      description: "Tire suas dúvidas diretamente com os vendedores e receba suporte especializado.",
      imageUrl: "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80"
    }
  ];

  const nextSlide = () => {
    if (currentSlide === slides.length - 1) {
      navigate('/login');
    } else {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="h-screen flex flex-col justify-between bg-construPro-lightgray">
      {slides[currentSlide] && (
        <OnboardingSlide {...slides[currentSlide]} />
      )}
      
      <div className="flex flex-col px-6 pb-12">
        <div className="flex justify-center mb-6">
          {slides.map((_, index) => (
            <div 
              key={index} 
              className={`h-2 w-2 rounded-full mx-1 ${
                index === currentSlide ? 'bg-construPro-orange' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
        
        <div className="flex justify-between">
          {currentSlide > 0 ? (
            <Button onClick={prevSlide} variant="ghost" className="text-gray-600">
              <ChevronLeft className="mr-1" size={20} /> Anterior
            </Button>
          ) : (
            <div></div> // Empty div to maintain layout
          )}
          
          {currentSlide < slides.length - 1 ? (
            <Button onClick={nextSlide} className="bg-construPro-orange hover:bg-orange-600 text-white">
              Próximo <ChevronRight className="ml-1" size={20} />
            </Button>
          ) : (
            <Button onClick={goToLogin} className="bg-construPro-orange hover:bg-orange-600 text-white">
              Começar
            </Button>
          )}
        </div>
        
        {currentSlide < slides.length - 1 && (
          <Button onClick={goToLogin} variant="link" className="text-construPro-blue mt-2">
            Pular
          </Button>
        )}
      </div>
    </div>
  );
};

export default OnboardingScreen;
