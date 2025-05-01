
import React, { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import CustomInput from '../common/CustomInput';
import ServiceRequestCard from './ServiceRequestCard';
import ListEmptyState from '../common/ListEmptyState';
import { serviceRequestsMock } from '@/data/serviceRequests';
import { ServiceRequest } from '@/types/services';

interface ServicesAvailableScreenProps {
  isProfessional: boolean;
}

// Categorias disponíveis para filtro
const availableCategories = [
  { value: 'todos', label: 'Todas categorias' },
  { value: 'piso', label: 'Pisos e Revestimentos' },
  { value: 'pintura', label: 'Pintura' },
  { value: 'eletrica', label: 'Elétrica' },
  { value: 'hidraulica', label: 'Hidráulica' },
  { value: 'alvenaria', label: 'Alvenaria' },
  { value: 'marcenaria', label: 'Marcenaria' },
];

// Faixas de orçamento para filtro
const budgetRanges = [
  { value: 'todos', label: 'Todos valores' },
  { value: '0-500', label: 'Até R$ 500' },
  { value: '500-1000', label: 'R$ 500 a R$ 1.000' },
  { value: '1000-3000', label: 'R$ 1.000 a R$ 3.000' },
  { value: '3000+', label: 'Acima de R$ 3.000' },
];

// Cidades disponíveis para filtro (exemplo - normalmente viriam da API)
const availableCities = [
  { value: 'todos', label: 'Todas cidades' },
  { value: 'sao-paulo', label: 'São Paulo' },
  { value: 'rio-de-janeiro', label: 'Rio de Janeiro' },
  { value: 'belo-horizonte', label: 'Belo Horizonte' },
];

const ServicesAvailableScreen: React.FC<ServicesAvailableScreenProps> = ({ isProfessional }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [category, setCategory] = useState('todos');
  const [city, setCity] = useState('todos');
  const [budgetRange, setBudgetRange] = useState('todos');
  
  const [filteredServices, setFilteredServices] = useState<ServiceRequest[]>([]);
  
  // Aplicar filtros quando os critérios mudarem
  useEffect(() => {
    let filtered = serviceRequestsMock.filter(request => request.status === 'aberto');
    
    // Aplicar busca por texto
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(service => 
        service.titulo.toLowerCase().includes(query) || 
        service.descricao.toLowerCase().includes(query)
      );
    }
    
    // Aplicar filtro de categoria
    if (category !== 'todos') {
      filtered = filtered.filter(service => service.categoria === category);
    }
    
    // Aplicar filtro de cidade (simplificado para demonstração)
    if (city !== 'todos') {
      filtered = filtered.filter(service => 
        service.endereco.toLowerCase().includes(city.replace('-', ' '))
      );
    }
    
    // Aplicar filtro de orçamento
    if (budgetRange !== 'todos') {
      filtered = filtered.filter(service => {
        if (!service.orcamento) return false;
        
        // Extrair apenas os números do formato "R$ X.XXX,XX"
        const value = parseFloat(service.orcamento.replace(/[^\d,]/g, '').replace(',', '.'));
        
        switch (budgetRange) {
          case '0-500':
            return value <= 500;
          case '500-1000':
            return value > 500 && value <= 1000;
          case '1000-3000':
            return value > 1000 && value <= 3000;
          case '3000+':
            return value > 3000;
          default:
            return true;
        }
      });
    }
    
    setFilteredServices(filtered);
  }, [searchQuery, category, city, budgetRange]);
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <CustomInput
          placeholder="Buscar serviços..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          isSearch
          className="flex-1"
        />
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? 'bg-gray-100' : ''}
        >
          <Filter size={18} />
        </Button>
      </div>
      
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-md">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              {availableCategories.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger>
              <SelectValue placeholder="Cidade" />
            </SelectTrigger>
            <SelectContent>
              {availableCities.map(c => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={budgetRange} onValueChange={setBudgetRange}>
            <SelectTrigger>
              <SelectValue placeholder="Orçamento" />
            </SelectTrigger>
            <SelectContent>
              {budgetRanges.map(range => (
                <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {filteredServices.length > 0 ? (
          filteredServices.map(service => (
            <ServiceRequestCard 
              key={service.id} 
              service={service} 
              isProfessional={isProfessional} 
              showSendProposalButton={isProfessional}
            />
          ))
        ) : (
          <ListEmptyState
            icon={<Search className="h-12 w-12 text-gray-400" />}
            title="Nenhum serviço disponível"
            description="Não há solicitações de serviço que correspondam aos seus critérios."
          />
        )}
      </div>
    </div>
  );
};

export default ServicesAvailableScreen;
