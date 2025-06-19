import React, { useState } from 'react';
import { ArrowLeft, User, Save, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useVendorProfile } from '@/hooks/useVendorProfile';
import { toast } from '@/components/ui/sonner';
import LoadingState from '@/components/common/LoadingState';

const VendorProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { vendorProfile, isLoading, updateVendorProfile } = useVendorProfile();
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    endereco_cep: vendorProfile?.endereco_cep || '',
    endereco_logradouro: vendorProfile?.endereco_logradouro || '',
    endereco_numero: vendorProfile?.endereco_numero || '',
    endereco_complemento: vendorProfile?.endereco_complemento || '',
    endereco_bairro: vendorProfile?.endereco_bairro || '',
    endereco_cidade: vendorProfile?.endereco_cidade || '',
    endereco_estado: vendorProfile?.endereco_estado || '',
    zona_entrega: vendorProfile?.zona_entrega || ''
  });

  React.useEffect(() => {
    if (vendorProfile) {
      setFormData({
        endereco_cep: vendorProfile.endereco_cep || '',
        endereco_logradouro: vendorProfile.endereco_logradouro || '',
        endereco_numero: vendorProfile.endereco_numero || '',
        endereco_complemento: vendorProfile.endereco_complemento || '',
        endereco_bairro: vendorProfile.endereco_bairro || '',
        endereco_cidade: vendorProfile.endereco_cidade || '',
        endereco_estado: vendorProfile.endereco_estado || '',
        zona_entrega: vendorProfile.zona_entrega || ''
      });
    }
  }, [vendorProfile]);

  const handleSave = async () => {
    try {
      setSaving(true);
      // Include all required fields for UpdateVendorProfileParams
      const updateData = {
        // Required basic fields from existing profile
        nome_loja: vendorProfile?.nome_loja || '',
        descricao: vendorProfile?.descricao || '',
        telefone: vendorProfile?.telefone || '',
        whatsapp: vendorProfile?.whatsapp || '',
        email: vendorProfile?.email || '',
        segmento: vendorProfile?.segmento || '',
        // Address fields from form
        ...formData
      };
      
      await updateVendorProfile(updateData);
      toast.success('Perfil do vendedor salvo com sucesso!');
      navigate('/vendor/settings');
    } catch (error) {
      console.error('Error saving vendor profile:', error);
      toast.error('Erro ao salvar perfil do vendedor');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingState text="Carregando perfil do vendedor..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-24 lg:pb-20">
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
                <h1 className="text-xl font-semibold text-gray-900">Perfil do Vendedor</h1>
                <p className="text-sm text-gray-500">Dados pessoais e informações de conta</p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
              {saving ? <LoadingState text="" /> : <Save size={16} />}
              Salvar
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Informações Pessoais */}
          <Card className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <User size={20} />
              Informações Pessoais
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email não pode ser alterado aqui
                </p>
              </div>

              <div>
                <Label>Status da Conta</Label>
                <Input
                  value={vendorProfile?.status || 'pendente'}
                  disabled
                  className="bg-gray-100 capitalize"
                />
              </div>
            </div>
          </Card>

          {/* Endereço */}
          <Card className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <MapPin size={20} />
              Endereço
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="endereco_cep">CEP</Label>
                <Input
                  id="endereco_cep"
                  value={formData.endereco_cep}
                  onChange={(e) => setFormData({ ...formData, endereco_cep: e.target.value })}
                  placeholder="00000-000"
                />
              </div>

              <div>
                <Label htmlFor="endereco_logradouro">Logradouro</Label>
                <Input
                  id="endereco_logradouro"
                  value={formData.endereco_logradouro}
                  onChange={(e) => setFormData({ ...formData, endereco_logradouro: e.target.value })}
                  placeholder="Rua, Avenida, etc."
                />
              </div>

              <div>
                <Label htmlFor="endereco_numero">Número</Label>
                <Input
                  id="endereco_numero"
                  value={formData.endereco_numero}
                  onChange={(e) => setFormData({ ...formData, endereco_numero: e.target.value })}
                  placeholder="123"
                />
              </div>

              <div>
                <Label htmlFor="endereco_complemento">Complemento</Label>
                <Input
                  id="endereco_complemento"
                  value={formData.endereco_complemento}
                  onChange={(e) => setFormData({ ...formData, endereco_complemento: e.target.value })}
                  placeholder="Apto, Sala, etc."
                />
              </div>

              <div>
                <Label htmlFor="endereco_bairro">Bairro</Label>
                <Input
                  id="endereco_bairro"
                  value={formData.endereco_bairro}
                  onChange={(e) => setFormData({ ...formData, endereco_bairro: e.target.value })}
                  placeholder="Nome do bairro"
                />
              </div>

              <div>
                <Label htmlFor="endereco_cidade">Cidade</Label>
                <Input
                  id="endereco_cidade"
                  value={formData.endereco_cidade}
                  onChange={(e) => setFormData({ ...formData, endereco_cidade: e.target.value })}
                  placeholder="Nome da cidade"
                />
              </div>

              <div>
                <Label htmlFor="endereco_estado">Estado</Label>
                <Input
                  id="endereco_estado"
                  value={formData.endereco_estado}
                  onChange={(e) => setFormData({ ...formData, endereco_estado: e.target.value })}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>

              <div>
                <Label htmlFor="zona_entrega">Zona de Entrega</Label>
                <Input
                  id="zona_entrega"
                  value={formData.zona_entrega}
                  onChange={(e) => setFormData({ ...formData, zona_entrega: e.target.value })}
                  placeholder="Descrição da zona de entrega"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VendorProfileScreen;
