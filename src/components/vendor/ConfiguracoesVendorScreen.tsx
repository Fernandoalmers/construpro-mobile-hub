
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Upload, Store, Phone, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVendorProfile, saveVendorProfile, uploadVendorImage, Vendor } from '@/services/vendorService';
import LoadingState from '../common/LoadingState';

const ConfiguracoesVendorScreen: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Vendor>>({
    nome_loja: '',
    descricao: '',
    segmento: '',
    telefone: '',
    whatsapp: '',
    email: '',
    formas_entrega: []
  });
  
  // File uploads
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | undefined>(undefined);
  const [bannerPreview, setBannerPreview] = useState<string | undefined>(undefined);
  
  // Store segments (could be fetched from an API in future)
  const storeSegments = [
    'Material de Construção',
    'Ferramentas',
    'Elétrica',
    'Hidráulica',
    'Tintas',
    'Acabamento',
    'Decoração',
    'Outro'
  ];
  
  // Fetch vendor profile
  const { data: vendorProfile, isLoading } = useQuery({
    queryKey: ['vendorProfile'],
    queryFn: getVendorProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Save vendor profile mutation
  const saveProfileMutation = useMutation({
    mutationFn: (data: Partial<Vendor>) => saveVendorProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorProfile'] });
      toast.success('Configurações da loja salvas com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao salvar configurações da loja');
      console.error('Error saving vendor profile:', error);
    }
  });
  
  // Initialize form with vendor profile data when available
  useEffect(() => {
    if (vendorProfile) {
      setFormData({
        ...vendorProfile,
      });
      
      // Set image previews if available
      if (vendorProfile.logo) {
        setLogoPreview(vendorProfile.logo);
      }
      
      if (vendorProfile.banner) {
        setBannerPreview(vendorProfile.banner);
      }
    }
  }, [vendorProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'logo' | 'banner') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (fileType === 'logo') {
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
      } else {
        setBannerFile(file);
        setBannerPreview(URL.createObjectURL(file));
      }
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.nome_loja) {
      toast.error('Nome da loja é obrigatório');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // First save basic profile data
      const savedProfile = await saveProfileMutation.mutateAsync(formData);
      
      if (!savedProfile) {
        throw new Error('Failed to save vendor profile');
      }
      
      // Upload logo if provided
      if (logoFile) {
        const logoUrl = await uploadVendorImage(logoFile, 'logos', `logo-${Date.now()}`);
        if (logoUrl) {
          await saveProfileMutation.mutateAsync({
            ...savedProfile,
            logo: logoUrl
          });
        }
      }
      
      // Upload banner if provided
      if (bannerFile) {
        const bannerUrl = await uploadVendorImage(bannerFile, 'banners', `banner-${Date.now()}`);
        if (bannerUrl) {
          await saveProfileMutation.mutateAsync({
            ...savedProfile,
            banner: bannerUrl
          });
        }
      }
      
      toast.success('Configurações da loja salvas com sucesso!');
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast.error('Erro ao salvar configurações da loja');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return <LoadingState text="Carregando dados da loja..." />;
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <div className="bg-white p-4 flex items-center shadow-sm">
        <button onClick={() => navigate('/vendor')} className="mr-4">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Configurações da Loja</h1>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Store Info */}
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <Store size={20} className="mr-2 text-gray-700" />
                <h2 className="text-lg font-semibold">Informações da Loja</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nome_loja" className="block mb-2">Nome da Loja *</Label>
                  <Input
                    id="nome_loja"
                    name="nome_loja"
                    value={formData.nome_loja}
                    onChange={handleInputChange}
                    placeholder="Nome da sua loja"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="descricao" className="block mb-2">Descrição da Loja</Label>
                  <Textarea
                    id="descricao"
                    name="descricao"
                    value={formData.descricao || ''}
                    onChange={handleInputChange}
                    placeholder="Descreva sua loja, produtos e diferenciais..."
                    rows={4}
                  />
                </div>
                
                <div>
                  <Label htmlFor="segmento" className="block mb-2">Segmento</Label>
                  <Select
                    value={formData.segmento || ''}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, segmento: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um segmento" />
                    </SelectTrigger>
                    <SelectContent>
                      {storeSegments.map(segment => (
                        <SelectItem key={segment} value={segment}>{segment}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
            
            {/* Contact Info */}
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <Phone size={20} className="mr-2 text-gray-700" />
                <h2 className="text-lg font-semibold">Informações de Contato</h2>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="telefone" className="block mb-2">Telefone</Label>
                    <Input
                      id="telefone"
                      name="telefone"
                      value={formData.telefone || ''}
                      onChange={handleInputChange}
                      placeholder="(00) 0000-0000"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="whatsapp" className="block mb-2">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      name="whatsapp"
                      value={formData.whatsapp || ''}
                      onChange={handleInputChange}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email" className="block mb-2">E-mail de Contato</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={handleInputChange}
                    placeholder="contato@sualoja.com.br"
                  />
                </div>
              </div>
            </Card>
            
            {/* Visual Identity */}
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <Camera size={20} className="mr-2 text-gray-700" />
                <h2 className="text-lg font-semibold">Identidade Visual</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="logo" className="block mb-2">Logo da Loja</Label>
                  <div 
                    className="border border-dashed border-gray-300 rounded-lg p-4 h-40 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
                    onClick={() => document.getElementById('logo')?.click()}
                  >
                    {logoPreview ? (
                      <img 
                        src={logoPreview} 
                        alt="Logo preview" 
                        className="h-full object-contain rounded-lg"
                      />
                    ) : (
                      <>
                        <Upload size={24} className="text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Clique para fazer upload do logo</p>
                      </>
                    )}
                    <input
                      id="logo"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'logo')}
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Recomendado: formato quadrado, pelo menos 200x200px
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="banner" className="block mb-2">Banner da Loja</Label>
                  <div 
                    className="border border-dashed border-gray-300 rounded-lg p-4 h-40 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
                    onClick={() => document.getElementById('banner')?.click()}
                  >
                    {bannerPreview ? (
                      <img 
                        src={bannerPreview} 
                        alt="Banner preview" 
                        className="h-full w-full object-cover rounded-lg"
                      />
                    ) : (
                      <>
                        <Upload size={24} className="text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Clique para fazer upload do banner</p>
                      </>
                    )}
                    <input
                      id="banner"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'banner')}
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Recomendado: formato retangular, pelo menos 1200x400px
                  </p>
                </div>
              </div>
            </Card>
            
            <div className="flex justify-end">
              <Button 
                type="button" 
                variant="outline"
                className="mr-2"
                onClick={() => navigate('/vendor')}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="bg-construPro-blue hover:bg-blue-700"
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfiguracoesVendorScreen;
