
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Filter, MapPin, Star, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/sonner';

const ServicesScreen: React.FC = () => {
  const navigate = useNavigate();

  // Mock data for services/professionals
  const professionals = [
    {
      id: 1,
      nome: 'João Silva',
      especialidade: 'Pedreiro',
      cidade: 'São Paulo',
      estado: 'SP',
      avaliacao: 4.8,
      servicos_realizados: 127,
      telefone: '(11) 99999-9999',
      sobre: 'Pedreiro experiente com mais de 10 anos de atuação em construção civil.'
    },
    {
      id: 2,
      nome: 'Maria Santos',
      especialidade: 'Eletricista',
      cidade: 'Rio de Janeiro',
      estado: 'RJ',
      avaliacao: 4.9,
      servicos_realizados: 89,
      telefone: '(21) 98888-8888',
      sobre: 'Eletricista especializada em instalações residenciais e comerciais.'
    },
    {
      id: 3,
      nome: 'Carlos Oliveira',
      especialidade: 'Pintor',
      cidade: 'Belo Horizonte',
      estado: 'MG',
      avaliacao: 4.7,
      servicos_realizados: 156,
      telefone: '(31) 97777-7777',
      sobre: 'Pintor profissional com experiência em residências e comércios.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-construPro-blue text-white p-4">
        <div className="flex items-center mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/20 mr-4"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Serviços</h1>
            <p className="text-sm opacity-90">Encontre profissionais qualificados</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Buscar por especialidade ou localização..."
            className="pl-10 bg-white text-gray-900"
          />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Filters */}
        <Card className="p-4">
          <div className="flex gap-2 overflow-x-auto">
            <Button variant="outline" size="sm" className="flex items-center gap-1 whitespace-nowrap">
              <Filter size={16} />
              Filtros
            </Button>
            <Badge variant="secondary" className="whitespace-nowrap">Pedreiro</Badge>
            <Badge variant="secondary" className="whitespace-nowrap">Eletricista</Badge>
            <Badge variant="secondary" className="whitespace-nowrap">Pintor</Badge>
            <Badge variant="secondary" className="whitespace-nowrap">Encanador</Badge>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button 
            className="bg-construPro-orange hover:bg-construPro-orange/90"
            onClick={() => navigate('/auth/professional-profile')}
          >
            <Plus size={20} className="mr-2" />
            Oferecer Serviços
          </Button>
          <Button 
            variant="outline"
            onClick={() => toast.info('Funcionalidade em desenvolvimento')}
          >
            Solicitar Serviço
          </Button>
        </div>

        {/* Professionals List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Profissionais Disponíveis</h2>
          
          {professionals.map((professional) => (
            <Card key={professional.id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{professional.nome}</h3>
                  <Badge variant="secondary" className="mb-2">
                    {professional.especialidade}
                  </Badge>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <MapPin size={16} className="mr-1" />
                    {professional.cidade}, {professional.estado}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center">
                      <Star size={16} className="text-yellow-500 mr-1" />
                      <span className="font-medium">{professional.avaliacao}</span>
                    </div>
                    <span className="text-gray-600">
                      {professional.servicos_realizados} serviços
                    </span>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => window.open(`https://wa.me/${professional.telefone.replace(/\D/g, '')}`, '_blank')}
                >
                  <Phone size={16} className="mr-1" />
                  Contatar
                </Button>
              </div>
              
              <p className="text-sm text-gray-600">{professional.sobre}</p>
            </Card>
          ))}
        </div>

        {/* Empty State Message */}
        <Card className="p-8 text-center">
          <p className="text-gray-500 mb-4">
            Esta é uma versão demonstrativa da funcionalidade de serviços.
          </p>
          <p className="text-sm text-gray-400">
            Em breve você poderá encontrar e contratar profissionais qualificados.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default ServicesScreen;
