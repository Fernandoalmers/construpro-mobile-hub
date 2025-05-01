
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, Globe, Mail } from 'lucide-react';
import Card from '../common/Card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '../../context/AuthContext';

const SettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Notification settings
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [promotionsEnabled, setPromotionsEnabled] = useState(true);
  const [serviceUpdatesEnabled, setServiceUpdatesEnabled] = useState(true);
  
  // Language settings
  const [language, setLanguage] = useState('pt-br');
  
  // Campaign preferences
  const [campaignPreference, setCampaignPreference] = useState('personalized');
  
  const handleSave = () => {
    // In a real app, this would send the settings to an API
    toast.success('Configurações salvas com sucesso!');
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-construPro-blue p-6 pt-12">
        <div className="flex items-center mb-4">
          <button onClick={() => navigate('/profile')} className="text-white">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-white ml-2">Configurações</h1>
        </div>
      </div>
      
      {/* Settings Sections */}
      <div className="p-6 space-y-6">
        <Card className="p-4">
          <h2 className="font-medium mb-4 flex items-center">
            <Bell size={18} className="mr-2 text-construPro-blue" />
            Notificações
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-notifications" className="font-medium">Notificações push</Label>
                <p className="text-sm text-gray-500">Receber notificações no dispositivo</p>
              </div>
              <Switch 
                id="push-notifications" 
                checked={pushEnabled} 
                onCheckedChange={setPushEnabled} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications" className="font-medium">Notificações por e-mail</Label>
                <p className="text-sm text-gray-500">Receber atualizações por e-mail</p>
              </div>
              <Switch 
                id="email-notifications" 
                checked={emailEnabled} 
                onCheckedChange={setEmailEnabled} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="promo-notifications" className="font-medium">Promoções e ofertas</Label>
                <p className="text-sm text-gray-500">Receber informações sobre promoções</p>
              </div>
              <Switch 
                id="promo-notifications" 
                checked={promotionsEnabled} 
                onCheckedChange={setPromotionsEnabled} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="service-notifications" className="font-medium">Atualizações de serviços</Label>
                <p className="text-sm text-gray-500">Receber atualizações de solicitações e projetos</p>
              </div>
              <Switch 
                id="service-notifications" 
                checked={serviceUpdatesEnabled} 
                onCheckedChange={setServiceUpdatesEnabled} 
              />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <h2 className="font-medium mb-4 flex items-center">
            <Globe size={18} className="mr-2 text-construPro-blue" />
            Preferência de Idioma
          </h2>
          
          <RadioGroup value={language} onValueChange={setLanguage}>
            <div className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value="pt-br" id="pt-br" />
              <Label htmlFor="pt-br">Português (Brasil)</Label>
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value="en" id="en" />
              <Label htmlFor="en">English (US)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="es" id="es" />
              <Label htmlFor="es">Español</Label>
            </div>
          </RadioGroup>
        </Card>
        
        <Card className="p-4">
          <h2 className="font-medium mb-4 flex items-center">
            <Mail size={18} className="mr-2 text-construPro-blue" />
            Preferências de Campanhas
          </h2>
          
          <RadioGroup value={campaignPreference} onValueChange={setCampaignPreference}>
            <div className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value="personalized" id="personalized" />
              <div>
                <Label htmlFor="personalized" className="font-medium">Conteúdo personalizado</Label>
                <p className="text-sm text-gray-500">Receber campanhas baseadas no seu perfil</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value="all" id="all" />
              <div>
                <Label htmlFor="all" className="font-medium">Todas as campanhas</Label>
                <p className="text-sm text-gray-500">Receber todas as campanhas disponíveis</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="none" id="none" />
              <div>
                <Label htmlFor="none" className="font-medium">Não receber</Label>
                <p className="text-sm text-gray-500">Não receber campanhas promocionais</p>
              </div>
            </div>
          </RadioGroup>
        </Card>
        
        <button 
          className="w-full bg-construPro-blue text-white rounded-md py-3 font-medium hover:bg-blue-700 transition-colors"
          onClick={handleSave}
        >
          Salvar configurações
        </button>
      </div>
    </div>
  );
};

export default SettingsScreen;
