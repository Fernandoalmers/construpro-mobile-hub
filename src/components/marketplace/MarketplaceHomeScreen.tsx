
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import CustomInput from '../common/CustomInput';
import { 
  Search, 
  Box, 
  Plug, 
  Droplet, 
  GlassWater, 
  Hammer, 
  Wrench, 
  UserPlus, 
  ShoppingBag,
  Construction
} from 'lucide-react';

// Imagens de fundo para as categorias
const categoryImages = {
  'materiais-construcao': '/lovable-uploads/1b629f74-0778-46a1-bb6a-4c30301e733e.png',
  'materiais-eletricos': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=300',
  'hidraulica': 'https://images.unsplash.com/photo-1584679109597-c656b19974c9?auto=format&fit=crop&w=300',
  'vidracaria': 'https://images.unsplash.com/photo-1496307653780-42ee777d4833?auto=format&fit=crop&w=300',
  'marcenaria': 'https://images.unsplash.com/photo-1565115021788-6d3f1ede4980?auto=format&fit=crop&w=300',
  'marmoraria': 'https://images.unsplash.com/photo-1466442929976-97f336a657be?auto=format&fit=crop&w=300',
  'ferramentas': 'https://images.unsplash.com/photo-1590959651373-a3db0f38a961?auto=format&fit=crop&w=300',
  'aluguel': 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=300',
  'profissionais': 'https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=300',
  'todos': 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=300'
};

const categoryBlocks = [
  {
    id: 'materiais-construcao',
    name: 'Materiais de Construção',
    icon: <Construction size={24} />,
    filter: { categoria: 'Materiais de Construção' }
  },
  {
    id: 'materiais-eletricos',
    name: 'Materiais Elétricos',
    icon: <Plug size={24} />,
    filter: { categoria: 'Materiais Elétricos' }
  },
  {
    id: 'hidraulica',
    name: 'Hidráulica',
    icon: <Droplet size={24} />,
    filter: { categoria: 'Hidráulica' }
  },
  {
    id: 'vidracaria',
    name: 'Vidraçaria',
    icon: <GlassWater size={24} />,
    filter: { categoria: 'Vidraçaria' }
  },
  {
    id: 'marcenaria',
    name: 'Marcenaria/MDF',
    icon: <Box size={24} />,
    filter: { categoria: 'Marcenaria' }
  },
  {
    id: 'marmoraria',
    name: 'Marmoraria',
    icon: <Box size={24} />,
    filter: { categoria: 'Marmoraria' }
  },
  {
    id: 'ferramentas',
    name: 'Ferramentas e Máquinas',
    icon: <Wrench size={24} />,
    filter: { categoria: 'Ferramentas' }
  },
  {
    id: 'aluguel',
    name: 'Aluguel de Equipamentos',
    icon: <Hammer size={24} />,
    filter: { categoria: 'Aluguel' }
  },
  {
    id: 'profissionais',
    name: 'Profissionais Cadastrados',
    icon: <UserPlus size={24} />,
    filter: { type: 'professionals' }
  },
  {
    id: 'todos',
    name: 'Ver todos os produtos',
    icon: <ShoppingBag size={24} />,
    filter: {}
  }
];

const MarketplaceHomeScreen: React.FC = () => {
  const navigate = useNavigate();

  const handleCategoryClick = (filter: any) => {
    if (filter.type === 'professionals') {
      navigate('/services');
      return;
    }
    
    // Navigate to marketplace with filter parameters
    const queryParams = new URLSearchParams();
    
    if (filter.categoria) {
      queryParams.append('categoria', filter.categoria);
    }
    
    navigate(`/marketplace/products?${queryParams.toString()}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-construPro-blue p-4 pt-8">
        <h1 className="text-2xl font-bold text-white mb-4">Loja</h1>
        
        <CustomInput
          isSearch
          placeholder="Buscar produtos"
          onClick={() => navigate('/marketplace/products')}
          className="mb-2 cursor-pointer"
          readOnly
        />
      </div>
      
      {/* Category blocks - redesigned for more elegance */}
      <div className="p-4">
        <h2 className="font-bold text-lg mb-3">Categorias</h2>
        
        <div className="grid grid-cols-2 gap-4">
          {categoryBlocks.map((category) => (
            <div 
              key={category.id}
              className="cursor-pointer"
              onClick={() => handleCategoryClick(category.filter)}
            >
              <div 
                className="relative h-40 rounded-lg overflow-hidden shadow-md"
                style={{ 
                  backgroundImage: `url(${categoryImages[category.id as keyof typeof categoryImages]})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {/* Gradient overlay for better text visibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                
                {/* Content positioned at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col items-start">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-2 shadow-md">
                    <span className="text-construPro-blue">
                      {category.icon}
                    </span>
                  </div>
                  <span className="text-white font-medium">{category.name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Promotional banner */}
      <div className="mx-4 mt-3 bg-construPro-orange/10 p-4 rounded-lg">
        <h3 className="text-construPro-orange font-bold mb-1">Ofertas especiais</h3>
        <p className="text-sm text-gray-600">
          Acumule pontos em todas as compras e troque por produtos exclusivos!
        </p>
      </div>
    </div>
  );
};

export default MarketplaceHomeScreen;
