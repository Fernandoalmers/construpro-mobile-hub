import React, { useState } from 'react';
import { ArrowLeft, Truck, Save, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';

interface DeliveryMethod {
  id: string;
  name: string;
  description: string;
  fee: number;
  estimatedTime: string;
  active: boolean;
}

const VendorDeliverySettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    freeDeliveryMinValue: 0,
    defaultDeliveryFee: 5.00,
    maxDeliveryDistance: 10,
    estimatedDeliveryTime: 'até 3 dias úteis'
  });

  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([
    {
      id: '1',
      name: 'Entrega Padrão',
      description: 'Entrega normal em horário comercial',
      fee: 5.00,
      estimatedTime: 'até 3 dias úteis',
      active: true
    },
    {
      id: '2',
      name: 'Entrega Expressa',
      description: 'Entrega rápida em até 24h',
      fee: 12.00,
      estimatedTime: 'até 24 horas',
      active: false
    }
  ]);

  const handleSave = async () => {
    try {
      setSaving(true);
      // Aqu você salvaria as configurações no backend
      // await saveDeliverySettings({ settings, deliveryMethods });
      toast.success('Configurações de entrega salvas com sucesso!');
      navigate('/vendor/settings');
    } catch (error) {
      console.error('Error saving delivery settings:', error);
      toast.error('Erro ao salvar configurações de entrega');
    } finally {
      setSaving(false);
    }
  };

  const addDeliveryMethod = () => {
    const newMethod: DeliveryMethod = {
      id: Date.now().toString(),
      name: '',
      description: '',
      fee: 0,
      estimatedTime: '',
      active: true
    };
    setDeliveryMethods([...deliveryMethods, newMethod]);
  };

  const updateDeliveryMethod = (id: string, updates: Partial<DeliveryMethod>) => {
    setDeliveryMethods(methods =>
      methods.map(method =>
        method.id === id ? { ...method, ...updates } : method
      )
    );
  };

  const removeDeliveryMethod = (id: string) => {
    setDeliveryMethods(methods => methods.filter(method => method.id !== id));
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
                <h1 className="text-xl font-semibold text-gray-900">Configurações de Entrega</h1>
                <p className="text-sm text-gray-500">Métodos de entrega e taxas</p>
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
          {/* Configurações Gerais */}
          <Card className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Truck size={20} />
              Configurações Gerais
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="freeDeliveryMinValue">Valor Mínimo para Frete Grátis (R$)</Label>
                <Input
                  id="freeDeliveryMinValue"
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.freeDeliveryMinValue}
                  onChange={(e) => setSettings({ ...settings, freeDeliveryMinValue: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Digite 0 para desabilitar frete grátis
                </p>
              </div>

              <div>
                <Label htmlFor="defaultDeliveryFee">Taxa de Entrega Padrão (R$)</Label>
                <Input
                  id="defaultDeliveryFee"
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.defaultDeliveryFee}
                  onChange={(e) => setSettings({ ...settings, defaultDeliveryFee: parseFloat(e.target.value) || 0 })}
                  placeholder="5.00"
                />
              </div>

              <div>
                <Label htmlFor="maxDeliveryDistance">Distância Máxima de Entrega (km)</Label>
                <Input
                  id="maxDeliveryDistance"
                  type="number"
                  min="1"
                  value={settings.maxDeliveryDistance}
                  onChange={(e) => setSettings({ ...settings, maxDeliveryDistance: parseInt(e.target.value) || 10 })}
                  placeholder="10"
                />
              </div>

              <div>
                <Label htmlFor="estimatedDeliveryTime">Prazo de Entrega Padrão</Label>
                <Input
                  id="estimatedDeliveryTime"
                  value={settings.estimatedDeliveryTime}
                  onChange={(e) => setSettings({ ...settings, estimatedDeliveryTime: e.target.value })}
                  placeholder="até 3 dias úteis"
                />
              </div>
            </div>
          </Card>

          {/* Métodos de Entrega */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Métodos de Entrega</h2>
              <Button onClick={addDeliveryMethod} variant="outline" size="sm" className="flex items-center gap-2">
                <Plus size={16} />
                Adicionar Método
              </Button>
            </div>

            <div className="space-y-4">
              {deliveryMethods.map((method) => (
                <div key={method.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={method.active}
                        onCheckedChange={(checked) => updateDeliveryMethod(method.id, { active: checked })}
                      />
                      <Label>Método Ativo</Label>
                    </div>
                    <Button
                      onClick={() => removeDeliveryMethod(method.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nome do Método</Label>
                      <Input
                        value={method.name}
                        onChange={(e) => updateDeliveryMethod(method.id, { name: e.target.value })}
                        placeholder="Ex: Entrega Expressa"
                      />
                    </div>

                    <div>
                      <Label>Taxa (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={method.fee}
                        onChange={(e) => updateDeliveryMethod(method.id, { fee: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <Label>Prazo Estimado</Label>
                      <Input
                        value={method.estimatedTime}
                        onChange={(e) => updateDeliveryMethod(method.id, { estimatedTime: e.target.value })}
                        placeholder="até 24 horas"
                      />
                    </div>

                    <div>
                      <Label>Descrição</Label>
                      <Textarea
                        value={method.description}
                        onChange={(e) => updateDeliveryMethod(method.id, { description: e.target.value })}
                        placeholder="Descrição do método de entrega"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {deliveryMethods.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Truck size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Nenhum método de entrega configurado</p>
                  <Button onClick={addDeliveryMethod} variant="outline" className="mt-2">
                    Adicionar Primeiro Método
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VendorDeliverySettingsScreen;
