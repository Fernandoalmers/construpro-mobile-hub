
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
      
      {/* Category blocks */}
      <div className="p-4">
        <h2 className="font-bold text-lg mb-3">Categorias</h2>
        
        <div className="grid grid-cols-2 gap-3">
          {categoryBlocks.map((category) => (
            <Card 
              key={category.id}
              className="p-4 flex flex-col items-center justify-center h-28 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleCategoryClick(category.filter)}
            >
              <div className="w-12 h-12 bg-construPro-blue/10 text-construPro-blue rounded-full flex items-center justify-center mb-2">
                {category.icon}
              </div>
              <span className="text-sm font-medium text-center">{category.name}</span>
            </Card>
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
