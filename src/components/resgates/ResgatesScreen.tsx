
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Gift, 
  Coins, 
  Star, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Calendar,
  Filter,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/sonner';

interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  imageUrl: string;
  category: string;
  available: boolean;
  expiresAt?: string;
}

interface Redemption {
  id: string;
  rewardTitle: string;
  pointsUsed: number;
  status: 'pending' | 'approved' | 'delivered' | 'cancelled';
  createdAt: string;
  deliveryDate?: string;
  trackingCode?: string;
}

const ResgatesScreen: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - em produção viria da API
  useEffect(() => {
    const mockRewards: Reward[] = [
      {
        id: '1',
        title: 'Furadeira Profissional',
        description: 'Furadeira de impacto 500W com kit de brocas',
        pointsCost: 2500,
        imageUrl: '/placeholder.svg',
        category: 'ferramentas',
        available: true,
        expiresAt: '2024-12-31'
      },
      {
        id: '2',
        title: 'Kit de EPIs',
        description: 'Capacete, luvas e óculos de proteção',
        pointsCost: 1500,
        imageUrl: '/placeholder.svg',
        category: 'seguranca',
        available: true
      },
      {
        id: '3',
        title: 'Vale Compras R$ 100',
        description: 'Vale para usar em qualquer loja parceira',
        pointsCost: 5000,
        imageUrl: '/placeholder.svg',
        category: 'vouchers',
        available: true
      },
      {
        id: '4',
        title: 'Caixa de Ferramentas',
        description: 'Caixa organizadora com divisórias',
        pointsCost: 1200,
        imageUrl: '/placeholder.svg',
        category: 'ferramentas',
        available: false
      }
    ];

    const mockRedemptions: Redemption[] = [
      {
        id: '1',
        rewardTitle: 'Kit de EPIs',
        pointsUsed: 1500,
        status: 'delivered',
        createdAt: '2024-01-15',
        deliveryDate: '2024-01-20',
        trackingCode: 'BR123456789'
      },
      {
        id: '2',
        rewardTitle: 'Vale Compras R$ 50',
        pointsUsed: 2500,
        status: 'pending',
        createdAt: '2024-01-20'
      }
    ];

    setRewards(mockRewards);
    setRedemptions(mockRedemptions);
    setIsLoading(false);
  }, []);

  const categories = [
    { id: 'all', name: 'Todas' },
    { id: 'ferramentas', name: 'Ferramentas' },
    { id: 'seguranca', name: 'Segurança' },
    { id: 'vouchers', name: 'Vouchers' },
    { id: 'materiais', name: 'Materiais' }
  ];

  const filteredRewards = rewards.filter(reward => {
    const matchesSearch = reward.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reward.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || reward.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleRedeem = (reward: Reward) => {
    if (!profile?.saldo_pontos || profile.saldo_pontos < reward.pointsCost) {
      toast.error('Pontos insuficientes para este resgate!');
      return;
    }

    if (!reward.available) {
      toast.error('Este item não está disponível no momento.');
      return;
    }

    // Aqui seria feita a chamada para a API de resgate
    toast.success(`Resgate de "${reward.title}" realizado com sucesso!`);
    navigate(`/resgates/${reward.id}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Processando</Badge>;
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-800">Aprovado</Badge>;
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800">Entregue</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>;
      default:
        return <Badge>Desconhecido</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} className="text-yellow-600" />;
      case 'approved':
        return <AlertCircle size={16} className="text-blue-600" />;
      case 'delivered':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'cancelled':
        return <AlertCircle size={16} className="text-red-600" />;
      default:
        return <Clock size={16} className="text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-300"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Header with light orange background */}
      <div className="bg-orange-300 py-6 px-4 shadow-lg">
        <div className="flex items-center mb-4">
          <Button 
            variant="ghost" 
            className="p-2 mr-2 text-orange-700 hover:bg-white/20" 
            onClick={() => navigate('/home')}
          >
            <ArrowLeft size={24} />
          </Button>
          <h1 className="text-xl font-bold text-orange-700">Recompensas</h1>
        </div>

        {/* Points Balance */}
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Coins size={24} className="text-orange-700 mr-2" />
              <div>
                <p className="text-orange-700 text-sm">Seus pontos</p>
                <p className="text-orange-700 text-2xl font-bold">
                  {(profile?.saldo_pontos || 0).toLocaleString()}
                </p>
              </div>
            </div>
            <Gift size={32} className="text-orange-700" />
          </div>
        </div>
      </div>

      <div className="p-4">
        <Tabs defaultValue="rewards" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rewards">Recompensas</TabsTrigger>
            <TabsTrigger value="history">Meus Resgates</TabsTrigger>
          </TabsList>

          <TabsContent value="rewards" className="space-y-4">
            {/* Search and Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar recompensas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex overflow-x-auto gap-2 pb-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    className={`whitespace-nowrap ${
                      selectedCategory === category.id 
                        ? 'bg-orange-300 text-orange-700 hover:bg-orange-400' 
                        : 'text-orange-700 border-orange-300 hover:bg-orange-50'
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Rewards Grid */}
            <div className="grid grid-cols-1 gap-4">
              {filteredRewards.map((reward) => (
                <Card key={reward.id} className="overflow-hidden">
                  <div className="flex">
                    <img
                      src={reward.imageUrl}
                      alt={reward.title}
                      className="w-24 h-24 object-cover"
                    />
                    <div className="flex-1 p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-orange-700 leading-tight">
                          {reward.title}
                        </h3>
                        {!reward.available && (
                          <Badge variant="secondary" className="text-xs">
                            Indisponível
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {reward.description}
                      </p>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Coins size={16} className="text-orange-600 mr-1" />
                          <span className="font-bold text-orange-700">
                            {reward.pointsCost.toLocaleString()}
                          </span>
                        </div>
                        
                        <Button
                          size="sm"
                          className="bg-orange-300 text-orange-700 hover:bg-orange-400"
                          onClick={() => handleRedeem(reward)}
                          disabled={!reward.available || (profile?.saldo_pontos || 0) < reward.pointsCost}
                        >
                          {(profile?.saldo_pontos || 0) < reward.pointsCost ? 'Pontos insuficientes' : 'Resgatar'}
                        </Button>
                      </div>
                      
                      {reward.expiresAt && (
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          <Calendar size={12} className="mr-1" />
                          Válido até {new Date(reward.expiresAt).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {filteredRewards.length === 0 && (
              <div className="text-center py-8">
                <Gift size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhuma recompensa encontrada</p>
                <p className="text-sm text-gray-500">Tente ajustar os filtros de busca</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {redemptions.length > 0 ? (
              <div className="space-y-3">
                {redemptions.map((redemption) => (
                  <Card key={redemption.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-orange-700 mb-1">
                          {redemption.rewardTitle}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <Coins size={14} className="text-orange-600 mr-1" />
                          <span>{redemption.pointsUsed.toLocaleString()} pontos</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getStatusIcon(redemption.status)}
                        {getStatusBadge(redemption.status)}
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex items-center">
                        <Calendar size={12} className="mr-1" />
                        Resgatado em {new Date(redemption.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                      
                      {redemption.deliveryDate && (
                        <div className="flex items-center">
                          <CheckCircle size={12} className="mr-1" />
                          Entregue em {new Date(redemption.deliveryDate).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                      
                      {redemption.trackingCode && (
                        <div className="flex items-center">
                          <span className="mr-1">📦</span>
                          Código: {redemption.trackingCode}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Gift size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum resgate realizado</p>
                <p className="text-sm text-gray-500">Seus resgates aparecerão aqui</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ResgatesScreen;
