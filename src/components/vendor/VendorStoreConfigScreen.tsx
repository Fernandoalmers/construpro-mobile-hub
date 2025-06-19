import React, { useState } from 'react';
import { ArrowLeft, Building2, Upload, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import { useVendorProfile } from '@/hooks/useVendorProfile';
import { toast } from '@/components/ui/sonner';
import LoadingState from '@/components/common/LoadingState';

const VendorStoreConfigScreen: React.FC = () => {
  const navigate = useNavigate();
  const { vendorProfile, isLoading, updateVendorProfile } = useVendorProfile();
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    nome_loja: vendorProfile?.nome_loja || '',
    descricao: vendorProfile?.descricao || '',
    telefone: vendorProfile?.telefone || '',
    whatsapp: vendorProfile?.whatsapp || '',
    email: vendorProfile?.email || '',
    segmento: vendorProfile?.segmento || ''
  });

  React.useEffect(() => {
    if (vendorProfile) {
      setFormData({
        nome_loja: vendorProfile.nome_loja || '',
        descricao: vendorProfile.descricao || '',
        telefone: vendorProfile.telefone || '',
        whatsapp: vendorProfile.whatsapp || '',
        email: vendorProfile.email || '',
        segmento: vendorProfile.segmento || ''
      });
    }
  }, [vendorProfile]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateVendorProfile({
        ...formData,
        logoFile,
        bannerFile
      });
      toast.success('Configurações da loja salvas com sucesso!');
      navigate('/vendor/settings');
    } catch (error) {
      console.error('Error saving store config:', error);
      toast.error('Erro ao salvar configurações da loja');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
    }
  };

  if (isLoading) {
    return <LoadingState text="Carregando configurações da loja..." />;
  }

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
                <h1 className="text-xl font-semibold text-gray-900">Informações da Loja</h1>
                <p className="text-sm text-gray-500">Configure os dados da sua loja</p>
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
          {/* Logo e Banner */}
          <Card className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Building2 size={20} />
              Identidade Visual
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="logo">Logo da Loja</Label>
                <div className="mt-2">
                  {vendorProfile?.logo && (
                    <div className="mb-3">
                      <img
                        src={vendorProfile.logo}
                        alt="Logo atual"
                        className="w-24 h-24 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('logo')?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload size={16} />
                      {logoFile ? 'Alterar Logo' : 'Upload Logo'}
                    </Button>
                    {logoFile && (
                      <span className="text-sm text-gray-600">{logoFile.name}</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="banner">Banner da Loja</Label>
                <div className="mt-2">
                  {vendorProfile?.banner && (
                    <div className="mb-3">
                      <img
                        src={vendorProfile.banner}
                        alt="Banner atual"
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      id="banner"
                      type="file"
                      accept="image/*"
                      onChange={handleBannerChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('banner')?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload size={16} />
                      {bannerFile ? 'Alterar Banner' : 'Upload Banner'}
                    </Button>
                    {bannerFile && (
                      <span className="text-sm text-gray-600">{bannerFile.name}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Informações Básicas */}
          <Card className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Informações Básicas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome_loja">Nome da Loja</Label>
                <Input
                  id="nome_loja"
                  value={formData.nome_loja}
                  onChange={(e) => setFormData({ ...formData, nome_loja: e.target.value })}
                  placeholder="Digite o nome da sua loja"
                />
              </div>

              <div>
                <Label htmlFor="segmento">Segmento</Label>
                <Input
                  id="segmento"
                  value={formData.segmento}
                  onChange={(e) => setFormData({ ...formData, segmento: e.target.value })}
                  placeholder="Ex: Alimentação, Moda, Eletrônicos"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="descricao">Descrição da Loja</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descreva sua loja, produtos e diferenciais"
                  rows={4}
                />
              </div>
            </div>
          </Card>

          {/* Informações de Contato */}
          <Card className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Informações de Contato</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VendorStoreConfigScreen;
