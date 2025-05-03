
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../common/Card';
import Avatar from '../common/Avatar';
import ProgressBar from '../common/ProgressBar';
import CustomButton from '../common/CustomButton';
import { Receipt, Gift, QrCode, MessageSquare, Award, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  // Calculate level info based on real user points
  const saldoPontos = profile?.saldo_pontos || 0;
  
  const levelPoints = {
    bronze: { min: 0, max: 2000 },
    silver: { min: 2000, max: 5000 },
    gold: { min: 5000, max: 5000 }, // Max is same as min for gold since it's the highest
  };

  let currentLevel = 'bronze';
  let nextLevel = 'silver';
  let currentProgress = 0;
  let maxProgress = 2000;
  
  if (saldoPontos >= levelPoints.gold.min) {
    currentLevel = 'gold';
    nextLevel = '';
    currentProgress = 5000;
    maxProgress = 5000;
  } else if (saldoPontos >= levelPoints.silver.min) {
    currentLevel = 'silver';
    nextLevel = 'gold';
    currentProgress = saldoPontos - levelPoints.silver.min;
    maxProgress = levelPoints.gold.min - levelPoints.silver.min;
  } else {
    currentProgress = saldoPontos;
    maxProgress = levelPoints.silver.min;
  }
  
  const levelMap = {
    bronze: { color: '#CD7F32', name: 'Bronze' },
    silver: { color: '#C0C0C0', name: 'Prata' },
    gold: { color: '#FFD700', name: 'Ouro' },
  };

  const shortcuts = [
    { id: 'extrato', label: 'Extrato', icon: <Receipt size={24} />, route: '/profile/points' },
    { id: 'resgates', label: 'Resgates', icon: <Gift size={24} />, route: '/resgates' },
    { id: 'qrcode', label: 'QR Code', icon: <QrCode size={24} />, route: '/qrcode' },
    { id: 'contato', label: 'Contato', icon: <MessageSquare size={24} />, route: '/chat' },
  ];

  const promoItems = [
    { 
      id: 1, 
      title: 'Ganhe 2x mais pontos', 
      description: 'Em compras de ferramentas elétricas neste final de semana',
      color: 'bg-blue-100'
    },
    { 
      id: 2, 
      title: 'Desconto exclusivo', 
      description: 'Membros Prata e Ouro têm 15% OFF em EPIs',
      color: 'bg-construPro-orange/10'
    },
    { 
      id: 3, 
      title: 'Nova loja parceira', 
      description: 'Conheça a Super Construção e ganhe pontos extras',
      color: 'bg-green-100'
    },
  ];

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
              onClick={() => navigate('/profile/points')}
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
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Award size={18} className="text-construPro-orange mr-2" />
              <h3 className="font-medium">Seu nível</h3>
            </div>
            <span 
              className="font-bold"
              style={{ color: levelMap[currentLevel as keyof typeof levelMap].color }}
            >
              {levelMap[currentLevel as keyof typeof levelMap].name}
            </span>
          </div>
          <ProgressBar 
            value={currentProgress} 
            max={maxProgress} 
            size="md"
            color="orange"
          />
          <p className="text-xs text-gray-500 mt-1 text-right">
            {nextLevel ? `Faltam ${maxProgress - currentProgress} pontos para o nível ${levelMap[nextLevel as keyof typeof levelMap].name}` : 'Nível máximo atingido!'}
          </p>
        </Card>
      </div>

      {/* Shortcuts */}
      <div className="p-6">
        <h2 className="font-bold text-lg text-gray-800 mb-4">Acesso rápido</h2>
        <div className="grid grid-cols-4 gap-3">
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
