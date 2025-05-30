
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/sonner';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import { useVendorProfile } from '@/hooks/useVendorProfile';
import LoadingState from '@/components/common/LoadingState';

const ConfiguracoesVendorScreen = () => {
  const navigate = useNavigate();
  const { vendorProfile, isLoading, updateVendorProfile } = useVendorProfile();
  const [formData, setFormData] = useState({
    nome_loja: '',
    descricao: '',
    telefone: '',
    whatsapp: '',
    email: '',
    segmento: '',
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load vendor profile data
  useEffect(() => {
    if (vendorProfile) {
      setFormData({
        nome_loja: vendorProfile.nome_loja || '',
        descricao: vendorProfile.descricao || '',
        telefone: vendorProfile.telefone || '',
        whatsapp: vendorProfile.whatsapp || '',
        email: vendorProfile.email || '',
        segmento: vendorProfile.segmento || '',
      });
      
      if (vendorProfile.logo) {
        setLogoPreview(vendorProfile.logo);
      }
      
      if (vendorProfile.banner) {
        setBannerPreview(vendorProfile.banner);
      }
    }
  }, [vendorProfile]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  // Handle banner file selection
  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const updatedProfile = await updateVendorProfile({
        ...formData,
        logoFile,
        bannerFile
      });
      
      if (updatedProfile) {
        toast.success('Configurações salvas com sucesso!');
      } else {
        toast.error('Erro ao salvar configurações');
      }
    } catch (error) {
      toast.error('Erro ao salvar configurações');
      console.error('Error saving vendor profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingState text="Carregando configurações..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white p-4 flex items-center shadow-sm sticky top-0 z-10">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/vendor')}
          className="flex items-center gap-1 mr-4"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold">Configurações da Loja</h1>
      </div>
      
      <div className="p-4 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nome_loja">Nome da Loja*</Label>
                <Input
                  id="nome_loja"
                  name="nome_loja"
                  value={formData.nome_loja}
                  onChange={handleChange}
                  required
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleChange}
                  rows={4}
                  className="mt-1"
                  placeholder="Descreva sua loja..."
                />
              </div>
              
              <div>
                <Label htmlFor="segmento">Segmento</Label>
                <Input
                  id="segmento"
                  name="segmento"
                  value={formData.segmento}
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="Ex: Material de Construção, Ferragens..."
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="seu@email.com"
                />
              </div>
              
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="(11) 99999-9999"
                />
              </div>
              
              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Imagens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="logo">Logo</Label>
                <div className="mt-2 flex items-center space-x-4">
                  {logoPreview && (
                    <div className="relative w-24 h-24 bg-gray-100 rounded-md overflow-hidden border">
                      <img 
                        src={logoPreview} 
                        alt="Logo Preview" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <Label 
                      htmlFor="logo-upload" 
                      className="inline-flex cursor-pointer items-center px-4 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {logoPreview ? 'Alterar Logo' : 'Selecionar Logo'}
                    </Label>
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Recomendado: 512x512px. JPG, PNG ou GIF.
                    </p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <Label htmlFor="banner">Banner</Label>
                <div className="mt-2 space-y-4">
                  {bannerPreview && (
                    <div className="relative w-full h-32 bg-gray-100 rounded-md overflow-hidden border">
                      <img 
                        src={bannerPreview} 
                        alt="Banner Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <Label 
                      htmlFor="banner-upload" 
                      className="inline-flex cursor-pointer items-center px-4 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {bannerPreview ? 'Alterar Banner' : 'Selecionar Banner'}
                    </Label>
                    <Input
                      id="banner-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleBannerChange}
                      className="hidden"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Recomendado: 1200x300px. JPG, PNG ou GIF.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Botão de Salvar - Agora mais destacado */}
          <div className="sticky bottom-4 bg-white p-4 rounded-lg shadow-lg border">
            <div className="flex gap-3">
              <Button 
                type="button"
                variant="outline"
                onClick={() => navigate('/vendor')}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSaving}
                className="flex-1 bg-construPro-orange hover:bg-orange-600 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfiguracoesVendorScreen;
