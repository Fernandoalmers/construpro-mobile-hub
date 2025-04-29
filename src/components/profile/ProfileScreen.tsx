
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../common/Avatar';
import Card from '../common/Card';
import ProgressBar from '../common/ProgressBar';
import CustomButton from '../common/CustomButton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Award, User, Lock, Settings, Bell, LogOut, ChevronRight } from 'lucide-react';
import clientes from '../../data/clientes.json';

const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  // Use the first client as the logged in user for demo
  const currentUser = clientes[0];
  
  const [notifications, setNotifications] = useState(true);
  const [vendorMode, setVendorMode] = useState(false);

  // Calculate level info
  const levelPoints = {
    bronze: { min: 0, max: 2000 },
    silver: { min: 2000, max: 5000 },
    gold: { min: 5000, max: 5000 }, // Max is same as min for gold since it's the highest
  };

  let currentLevel = 'bronze';
  let nextLevel = 'silver';
  let currentProgress = 0;
  let maxProgress = 2000;
  
  if (currentUser.saldoPontos >= levelPoints.gold.min) {
    currentLevel = 'gold';
    nextLevel = '';
    currentProgress = 5000;
    maxProgress = 5000;
  } else if (currentUser.saldoPontos >= levelPoints.silver.min) {
    currentLevel = 'silver';
    nextLevel = 'gold';
    currentProgress = currentUser.saldoPontos - levelPoints.silver.min;
    maxProgress = levelPoints.gold.min - levelPoints.silver.min;
  } else {
    currentProgress = currentUser.saldoPontos;
    maxProgress = levelPoints.silver.min;
  }
  
  const levelMap = {
    bronze: { color: '#CD7F32', name: 'Bronze' },
    silver: { color: '#C0C0C0', name: 'Prata' },
    gold: { color: '#FFD700', name: 'Ouro' },
  };

  const toggleVendorMode = () => {
    setVendorMode(!vendorMode);
    if (!vendorMode) {
      // In a real app, this would redirect to vendor dashboard
      navigate('/vendor');
    }
  };

  const handleLogout = () => {
    // In a real app, this would clear auth state
    navigate('/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-construPro-blue p-6 pt-12 rounded-b-3xl">
        <div className="flex flex-col items-center mb-4">
          <Avatar 
            src={currentUser.avatar} 
            alt={currentUser.nome}
            fallback={currentUser.nome}
            size="xl" 
            className="border-4 border-white mb-3"
          />
          <h1 className="text-xl font-bold text-white">{currentUser.nome}</h1>
          <p className="text-white text-opacity-70">{currentUser.email}</p>
          <div className="mt-2 bg-white px-4 py-1 rounded-full text-sm">
            <span className="font-medium text-construPro-blue">Código: </span>
            <span>{currentUser.codigo}</span>
          </div>
        </div>
      </div>
      
      {/* Level Card */}
      <div className="px-6 -mt-6">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Award size={18} className="text-construPro-orange mr-2" />
              <h3 className="font-medium">Nível</h3>
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
            showLabel={true}
            size="md"
            color="orange"
          />
          <p className="text-xs text-gray-500 mt-1 text-center">
            {nextLevel 
              ? `Faltam ${maxProgress - currentProgress} pontos para o nível ${levelMap[nextLevel as keyof typeof levelMap].name}` 
              : 'Nível máximo atingido!'}
          </p>
        </Card>
      </div>

      {/* Settings */}
      <div className="p-6 space-y-4">
        <Card className="overflow-hidden">
          <div className="divide-y divide-gray-100">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <User className="text-construPro-blue mr-3" size={20} />
                <span>Dados pessoais</span>
              </div>
              <ChevronRight className="text-gray-400" size={18} />
            </div>
            
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <Lock className="text-construPro-blue mr-3" size={20} />
                <span>Alterar senha</span>
              </div>
              <ChevronRight className="text-gray-400" size={18} />
            </div>
            
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <Settings className="text-construPro-blue mr-3" size={20} />
                <span>Configurações</span>
              </div>
              <ChevronRight className="text-gray-400" size={18} />
            </div>
            
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <Bell className="text-construPro-blue mr-3" size={20} />
                <span>Notificações</span>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Modo Vendedor</h3>
              <p className="text-sm text-gray-500">
                Acesse o painel de lojista
              </p>
            </div>
            <Switch
              checked={vendorMode}
              onCheckedChange={toggleVendorMode}
            />
          </div>
        </Card>
        
        <CustomButton 
          variant="outline" 
          fullWidth
          onClick={handleLogout}
          className="text-red-600 border-red-200"
          icon={<LogOut size={18} />}
        >
          Sair
        </CustomButton>
      </div>
    </div>
  );
};

export default ProfileScreen;
