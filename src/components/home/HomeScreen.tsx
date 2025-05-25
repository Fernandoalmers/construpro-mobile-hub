import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, Product } from '@/services/productService';
import { getUserProfile } from '@/services/userService';
import { useAuth } from '@/context/AuthContext';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';
import Card from '../common/Card';
import Avatar from '../common/Avatar';
import CustomButton from '../common/CustomButton';
import { Receipt, Gift, MessageSquare, Award, ChevronRight } from 'lucide-react';
import { calculateMonthlyPoints, calculateLevelInfo, getCurrentMonthName } from '@/utils/pointsCalculations';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MonthlyLevelProgress from '../profile/points-history/MonthlyLevelProgress';

// Define the shortcuts array for the quick access section (removed Escanear)
const shortcuts = [
  {
    id: 'receipt',
    label: 'Compras',
    route: '/compras',
    icon: <Receipt size={24} />
  },
  {
    id: 'rewards',
    label: 'Resgates',
    route: '/resgates',
    icon: <Gift size={24} />
  },
  {
    id: 'chat',
    label: 'Suporte',
    route: '/suporte',
    icon: <MessageSquare size={24} />
  }
];

// Define the promotion items
const promoItems = [
  {
    id: 1,
    title: 'Dobro de pontos em materiais elétricos',
    description: 'Promoção válida até 30/06/2025',
    color: 'bg-amber-50'
  },
  {
    id: 2,
    title: 'Compre e ganhe um brinde',
    description: 'Nas compras acima de R$ 300,00',
    color: 'bg-blue-50'
  },
  {
    id: 3,
    title: 'Indique um amigo e ganhe 50 pontos',
    description: 'Cada amigo que se cadastrar',
    color: 'bg-green-50'
  }
];

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch point transactions for monthly level calculation
  const { data: transactions = [] } = useQuery({
    queryKey: ['pointsHistory', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('data', { ascending: false });
      
      if (error) {
        console.error('Error fetching points history:', error);
        return [];
      }
      
      return data;
    },
    enabled: !!user
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch products
        const productsData = await getProducts();
        setFeaturedProducts(productsData.slice(0, 6));
        
        // Extract unique categories
        const uniqueCategories = Array.from(new Set(productsData.map(p => p.categoria)));
        setCategories(uniqueCategories);
        
        // Get user profile if logged in but profile not in auth context
        if (user && !profile) {
          await getUserProfile();
        }
      } catch (err) {
        console.error('Error fetching home data:', err);
        setError('Erro ao carregar dados iniciais');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, profile]);

  if (loading) {
    return <LoadingState text="Carregando..." />;
  }

  if (error) {
    return (
      <ErrorState 
        title="Erro ao carregar dados" 
        message={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Calculate level info based on monthly points
  const saldoPontos = profile?.saldo_pontos || 0;
  
  // Calculate monthly points and level
  const monthlyPoints = calculateMonthlyPoints(transactions);
  const levelInfo = calculateLevelInfo(monthlyPoints);
  const currentMonth = getCurrentMonthName();
  
  // Get user's name from profile or user metadata
  const userName = profile?.nome || user?.user_metadata?.nome || "Usuário";

  return (
    <div className="flex flex-col bg-gray-100 min-h-screen pb-20">
      {/* Header Section */}
      <div className="bg-construPro-blue p-6 pt-12 rounded-b-3xl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-white text-opacity-80">Olá,</p>
            <h1 className="text-2xl font-bold text-white">{userName.split(' ')[0]}!</h1>
          </div>
          <Avatar 
            src={profile?.avatar || undefined} 
            alt={userName}
            fallback={userName}
            size="lg" 
            className="border-2 border-white"
            onClick={() => navigate('/profile')}
          />
        </div>
        
        <Card className="p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-gray-600">Seu saldo</p>
            <CustomButton 
              variant="link" 
              onClick={() => navigate('/profile/points-history')}
              className="flex items-center text-construPro-blue p-0"
            >
              Ver extrato <ChevronRight size={16} />
            </CustomButton>
          </div>
          <h2 className="text-3xl font-bold text-construPro-blue mb-1">{saldoPontos.toLocaleString()} pontos</h2>
        </Card>
      </div>

      {/* Level Card */}
      <div className="px-6 -mt-6">
        <MonthlyLevelProgress
          currentMonth={currentMonth}
          levelInfo={levelInfo}
        />
      </div>

      {/* Shortcuts */}
      <div className="p-6">
        <h2 className="font-bold text-lg text-gray-800 mb-4">Acesso rápido</h2>
        <div className="grid grid-cols-3 gap-3">
          {shortcuts.map((shortcut) => (
            <button 
              key={shortcut.id} 
              className="flex flex-col items-center"
              onClick={() => navigate(shortcut.route)}
            >
              <div className="w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center mb-2 text-construPro-orange">
                {shortcut.icon}
              </div>
              <span className="text-sm text-gray-700">{shortcut.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Promotions */}
      <div className="p-6 pt-2">
        <h2 className="font-bold text-lg text-gray-800 mb-4">Promoções e Novidades</h2>
        <div className="space-y-4">
          {promoItems.map((item) => (
            <Card key={item.id} className={`p-4 border-l-4 border-construPro-orange ${item.color}`}>
              <h3 className="font-bold">{item.title}</h3>
              <p className="text-sm text-gray-700">{item.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
