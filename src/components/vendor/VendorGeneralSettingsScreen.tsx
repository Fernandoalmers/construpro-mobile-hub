import React, { useState } from 'react';
import { ArrowLeft, Settings, Bell, Shield, Eye, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';

const VendorGeneralSettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    emailNotifications: true,
    orderNotifications: true,
    marketingEmails: false,
    profileVisible: true,
    showPhone: true,
    showEmail: false,
    autoAcceptOrders: false,
    lowStockAlerts: true
  });

  const handleSave = async () => {
    try {
      setSaving(true);
      // Aqui você salvaria as configurações no backend
      // await saveVendorSettings(settings);
      toast.success('Configurações gerais salvas com sucesso!');
      navigate('/vendor/settings');
    } catch (error) {
      console.error('Error saving general settings:', error);
      toast.error('Erro ao salvar configurações gerais');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/vendor/settings')}
                className="flex items-center"
              >
                <ArrowLeft size={16} className="mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Configurações Gerais</h1>
                <p className="text-sm text-gray-500">Outras configurações da conta</p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
              {saving ? <span>Salvando...</span> : <Save size={16} />}
              Salvar
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Notificações */}
          <Card className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Bell size={20} />
              Notificações
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notificações por Email</Label>
                  <p className="text-sm text-gray-500">Receba notificações importantes por email</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Notificações de Pedidos</Label>
                  <p className="text-sm text-gray-500">Seja notificado sobre novos pedidos</p>
                </div>
                <Switch
                  checked={settings.orderNotifications}
                  onCheckedChange={(checked) => handleSettingChange('orderNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Emails de Marketing</Label>
                  <p className="text-sm text-gray-500">Receba dicas e novidades sobre vendas</p>
                </div>
                <Switch
                  checked={settings.marketingEmails}
                  onCheckedChange={(checked) => handleSettingChange('marketingEmails', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Alertas de Estoque Baixo</Label>
                  <p className="text-sm text-gray-500">Receba alertas quando produtos estiverem com estoque baixo</p>
                </div>
                <Switch
                  checked={settings.lowStockAlerts}
                  onCheckedChange={(checked) => handleSettingChange('lowStockAlerts', checked)}
                />
              </div>
            </div>
          </Card>

          {/* Privacidade */}
          <Card className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Shield size={20} />
              Privacidade
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Perfil Visível</Label>
                  <p className="text-sm text-gray-500">Permitir que clientes vejam seu perfil público</p>
                </div>
                <Switch
                  checked={settings.profileVisible}
                  onCheckedChange={(checked) => handleSettingChange('profileVisible', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Mostrar Telefone</Label>
                  <p className="text-sm text-gray-500">Exibir telefone no perfil público da loja</p>
                </div>
                <Switch
                  checked={settings.showPhone}
                  onCheckedChange={(checked) => handleSettingChange('showPhone', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Mostrar Email</Label>
                  <p className="text-sm text-gray-500">Exibir email no perfil público da loja</p>
                </div>
                <Switch
                  checked={settings.showEmail}
                  onCheckedChange={(checked) => handleSettingChange('showEmail', checked)}
                />
              </div>
            </div>
          </Card>

          {/* Automação */}
          <Card className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Settings size={20} />
              Automação
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Aceitar Pedidos Automaticamente</Label>
                  <p className="text-sm text-gray-500">Aceitar novos pedidos automaticamente sem revisão manual</p>
                </div>
                <Switch
                  checked={settings.autoAcceptOrders}
                  onCheckedChange={(checked) => handleSettingChange('autoAcceptOrders', checked)}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VendorGeneralSettingsScreen;
