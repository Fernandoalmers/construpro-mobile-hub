
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  ShoppingBag, 
  Gift, 
  Star, 
  Truck, 
  MapPin, 
  Smartphone,
  Ticket,
  Award,
  Users,
  Store,
  Scan,
  ShoppingCart,
  HelpCircle,
  User,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useMarketplaceData } from '@/hooks/useMarketplaceData';
import { useRewardsData } from '@/hooks/useRewardsData';
import BottomTabNavigator from '@/components/layout/BottomTabNavigator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Avatar from '@/components/common/Avatar';
import { useHomeScreenData } from '@/hooks/useHomeScreenData';

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { products, isLoading: produtosLoading } = useMarketplaceData(null);
  const { rewards, isLoading: rewardsLoading } = useRewardsData();
  
  // Usar dados reais do Supabase - agora com a mesma lógica da página de pontos
  const {
    userPoints,
    monthlyPoints,
    currentLevel,
    levelProgress,
    pointsToNextLevel,
    nextLevelName,
    currentMonth,
    isLoading: pointsLoading,
    hasTransactions,
    refreshData
  } = useHomeScreenData();

  // Debug: Log valores para comparação com página de pontos
  useEffect(() => {
    if (!pointsLoading) {
      console.log('🏠 [HomeScreen] Dados atualizados:', {
        userPoints,
        monthlyPoints,
        currentLevel: currentLevel.name,
        levelProgress,
        pointsToNextLevel,
        nextLevelName,
        currentMonth
      });
    }
  }, [userPoints, monthlyPoints, currentLevel, levelProgress, pointsToNextLevel, nextLevelName, currentMonth, pointsLoading]);

  const quickAccessItems = [
    {
      icon: <ShoppingCart className="h-6 w-6" />,
      title: 'Compras',
      subtitle: 'Ver pedidos',
      path: '/compras',
      color: 'bg-blue-500'
    },
    {
      icon: <Gift className="h-6 w-6" />,
      title: 'Resgates',
      subtitle: 'Troque seus pontos',
      path: '/resgates',
      color: 'bg-green-500'
    },
    {
      icon: <HelpCircle className="h-6 w-6" />,
      title: 'Suporte',
      subtitle: 'Ajuda e contato',
      path: '/suporte',
      color: 'bg-purple-500'
    }
  ];

  const handleQuickAccess = (path: string) => {
    navigate(path);
  };

  const promotionalOffers = [
    {
      title: "Ganhe 500 pontos",
      subtitle: "Em compras acima de R$ 200",
      validUntil: "31/12/2024",
      color: "bg-green-500"
    },
    {
      title: "Frete Grátis",
      subtitle: "Para pedidos acima de R$ 150",
      validUntil: "15/01/2025",
      color: "bg-blue-500"
    },
    {
      title: "Desconto 15%",
      subtitle: "Em ferramentas elétricas",
      validUntil: "28/12/2024",
      color: "bg-orange-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Smartphone className="h-8 w-8 text-royal-blue mr-2" />
              <h1 className="text-xl font-bold text-gray-900">Matershop</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Avatar
                src={profile?.avatar}
                alt={profile?.nome || 'Usuario'}
                fallback={profile?.nome}
                size="sm"
                onClick={() => navigate('/profile')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Welcome Section */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Olá, {profile?.nome || user?.user_metadata?.name || 'Usuário'}!
          </h2>
          <p className="text-gray-600 text-sm">
            Bem-vindo de volta ao seu marketplace de confiança
          </p>
        </div>

        {/* Saldo de Pontos - Usando exatamente a mesma lógica da página de pontos */}
        <Card className="mb-4 bg-gradient-to-r from-royal-blue to-royal-blue/80 text-white">
          <CardContent className="p-4">
            {pointsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-32 bg-white/20" />
                <Skeleton className="h-6 w-48 bg-white/20" />
                <Skeleton className="h-2 w-full bg-white/20" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-white/80 text-xs mb-1">Seu saldo</p>
                    <div className="flex items-center space-x-2">
                      <Award className="h-5 w-5" />
                      <span className="text-xl font-bold">
                        {userPoints.toLocaleString()} pontos
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white/80 text-xs mb-1">Nível</p>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${currentLevel.color}`}></div>
                      <span className="font-medium text-sm">{currentLevel.name}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/profile/points-history')}
                    className="text-white hover:bg-white/10 p-1 h-auto text-xs"
                  >
                    Ver extrato <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>

                {/* Progresso do nível - usando exatamente a mesma lógica */}
                {nextLevelName && pointsToNextLevel > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-white/80 mb-1">
                      <span>Nível {currentMonth}: {nextLevelName}</span>
                      <span>{pointsToNextLevel} pontos restantes</span>
                    </div>
                    <Progress value={levelProgress} className="h-1 bg-white/20" />
                  </div>
                )}

                {/* Informação sobre pontos mensais */}
                {hasTransactions && (
                  <div className="mt-2 text-center">
                    <p className="text-white/80 text-xs">
                      {monthlyPoints} pontos conquistados em {currentMonth}
                    </p>
                  </div>
                )}

                {/* Mostrar informações específicas quando não há transações */}
                {!hasTransactions && (
                  <div className="mt-3 text-center">
                    <p className="text-white/80 text-xs">
                      Faça sua primeira compra para começar a ganhar pontos!
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Access */}
        <div className="mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Acesso Rápido</h3>
          <div className="grid grid-cols-3 gap-3">
            {quickAccessItems.map((item, index) => (
              <Card 
                key={index} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleQuickAccess(item.path)}
              >
                <CardContent className="p-3 text-center">
                  <div className={`${item.color} w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 text-white`}>
                    {item.icon}
                  </div>
                  <h4 className="font-medium text-gray-900 text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-gray-500">{item.subtitle}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Promoções */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900">Promoções</h3>
            <Button
              variant="outline"
              onClick={() => navigate('/marketplace')}
              size="sm"
              className="text-xs"
            >
              Ver Todas
            </Button>
          </div>
          
          <div className="space-y-2">
            {promotionalOffers.map((offer, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-sm transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    <div className={`${offer.color} w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0`}>
                      <Gift className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm">{offer.title}</h4>
                      <p className="text-xs text-gray-600">{offer.subtitle}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-500">Válido até</p>
                      <p className="text-xs font-medium text-gray-700">{offer.validUntil}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Produtos em Destaque */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900">Produtos em Destaque</h3>
            <Button
              variant="outline"
              onClick={() => navigate('/marketplace')}
              size="sm"
              className="text-xs"
            >
              Ver Mais
            </Button>
          </div>
          
          {produtosLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-3">
                    <Skeleton className="w-full h-24 mb-2" />
                    <Skeleton className="h-3 w-3/4 mb-1" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {products.slice(0, 4).map((produto) => (
                <Card 
                  key={produto.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/produto/${produto.id}`)}
                >
                  <CardContent className="p-3">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                      {produto.imagens && produto.imagens.length > 0 ? (
                        <img 
                          src={produto.imagens[0]} 
                          alt={produto.nome}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <ShoppingBag className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <h4 className="font-medium text-gray-900 text-xs mb-1 line-clamp-2">
                      {produto.nome}
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-green-600">
                        R$ {produto.preco_normal?.toFixed(2)}
                      </span>
                      {produto.pontos_consumidor > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          +{produto.pontos_consumidor} pts
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomTabNavigator />
    </div>
  );
};

export default HomeScreen;
