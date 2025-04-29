
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FilterChips from '../common/FilterChips';
import CustomInput from '../common/CustomInput';
import ListEmptyState from '../common/ListEmptyState';
import { Search, Gift } from 'lucide-react';
import ResgateCard from './ResgateCard';
import clientes from '../../data/clientes.json';

// Mock rewards data
const mockResgates = [
  {
    id: '1',
    titulo: 'Vale-compra R$100',
    pontos: 1000,
    categoria: 'Vale-compra',
    imagemUrl: 'https://images.unsplash.com/photo-1577132922436-e9c50c3f10c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80'
  },
  {
    id: '2',
    titulo: 'Jogo de Chaves de Fenda',
    pontos: 500,
    categoria: 'Ferramentas',
    imagemUrl: 'https://images.unsplash.com/photo-1629743483408-c165e5296a99?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80'
  },
  {
    id: '3',
    titulo: 'Camiseta ConstruPro',
    pontos: 300,
    categoria: 'Vestuário',
    imagemUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80'
  },
  {
    id: '4',
    titulo: 'Vale-compra R$200',
    pontos: 2000,
    categoria: 'Vale-compra',
    imagemUrl: 'https://images.unsplash.com/photo-1577132922436-e9c50c3f10c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80'
  },
  {
    id: '5',
    titulo: 'Kit EPI',
    pontos: 800,
    categoria: 'EPIs',
    imagemUrl: 'https://images.unsplash.com/photo-1581141849291-1125c7b692b5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80'
  },
  {
    id: '6',
    titulo: 'Trena Digital',
    pontos: 600,
    categoria: 'Ferramentas',
    imagemUrl: 'https://images.unsplash.com/photo-1544982877-f0f4427dee24?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80'
  },
  {
    id: '7',
    titulo: 'Lanterna de Cabeça',
    pontos: 400,
    categoria: 'Ferramentas',
    imagemUrl: 'https://images.unsplash.com/photo-1588615419966-0c0f3bb797b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80'
  }
];

const ResgatesScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Use the first client as the logged in user for demo
  const currentUser = clientes[0];
  const saldoPontos = currentUser.saldoPontos;
  
  // Extract unique categories
  const categorias = Array.from(new Set(mockResgates.map(resgate => resgate.categoria)))
    .map(cat => ({ id: cat, label: cat }));

  // Filter resgates based on search and categories
  const filteredResgates = mockResgates.filter(resgate => {
    const matchesSearch = searchTerm === '' || 
      resgate.titulo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategories.length === 0 || 
      selectedCategories.includes(resgate.categoria);
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-construPro-blue p-6 pt-12 rounded-b-3xl">
        <h1 className="text-2xl font-bold text-white mb-4">Resgate de Pontos</h1>
        
        <div className="bg-white p-4 rounded-xl shadow-md mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600">Seu saldo</p>
          </div>
          <h2 className="text-3xl font-bold text-construPro-blue mb-1">
            {saldoPontos.toLocaleString()} pontos
          </h2>
        </div>
        
        <CustomInput
          isSearch
          placeholder="Buscar recompensas"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />
        
        <div>
          <p className="text-white text-sm mb-2">Filtrar por categoria</p>
          <div className="overflow-x-auto">
            <div className="inline-flex pb-2">
              <FilterChips
                items={categorias}
                selectedIds={selectedCategories}
                onChange={setSelectedCategories}
                allowMultiple
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Rewards List */}
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg text-gray-800">Recompensas disponíveis</h2>
          <button 
            onClick={() => navigate('/historico-resgates')}
            className="text-construPro-blue text-sm font-medium"
          >
            Ver histórico
          </button>
        </div>

        {filteredResgates.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {filteredResgates.map(resgate => (
              <ResgateCard
                key={resgate.id}
                resgate={resgate}
                disabled={saldoPontos < resgate.pontos}
                onClick={() => navigate(`/resgate/${resgate.id}`)}
              />
            ))}
          </div>
        ) : (
          <ListEmptyState
            title="Nenhuma recompensa encontrada"
            description="Tente mudar os filtros ou buscar por outro termo."
            icon={<Gift size={40} />}
            action={{
              label: "Limpar filtros",
              onClick: () => {
                setSearchTerm('');
                setSelectedCategories([]);
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ResgatesScreen;
