
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Card, 
  CardHeader, 
  CardTitle,
  CardContent,
  CardFooter 
} from '@/components/ui/card';
import { VendorProfile, saveVendorProfile, uploadVendorImage } from '@/services/vendorProfileService';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';

const ConfiguracoesVendorScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<{ logo: boolean, banner: boolean }>({ logo: false, banner: false });
  const navigate = useNavigate();
  
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [formValues, setFormValues] = useState<Partial<VendorProfile>>({
    nome_loja: '',
    descricao: '',
    segmento: '',
    email: '',
    telefone: '',
    whatsapp: ''
  });

  useEffect(() => {
    const fetchVendorProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Import dynamically to avoid circular dependencies
        const { getVendorProfile } = await import('@/services/vendorProfileService');
        const profile = await getVendorProfile();
        
        if (profile) {
          setVendorProfile(profile);
          setFormValues({
            nome_loja: profile.nome_loja || '',
            descricao: profile.descricao || '',
            segmento: profile.segmento || '',
            email: profile.email || '',
            telefone: profile.telefone || '',
            whatsapp: profile.whatsapp || ''
          });
        }
      } catch (err) {
        console.error('Error fetching vendor profile:', err);
        setError('Erro ao carregar o perfil do vendedor');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVendorProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      const updatedProfile = await saveVendorProfile({
        ...formValues,
        // Ensure nome_loja is set
        nome_loja: formValues.nome_loja || 'Minha Loja'
      });
      
      if (updatedProfile) {
        setVendorProfile(updatedProfile);
        toast.success('Perfil atualizado com sucesso');
      } else {
        toast.error('Erro ao atualizar o perfil');
      }
    } catch (err) {
      console.error('Error saving vendor profile:', err);
      toast.error('Erro ao salvar as alterações');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setUploading(prev => ({ ...prev, [type]: true }));
      
      const imageUrl = await uploadVendorImage(file, type);
      
      if (imageUrl) {
        // Update form and vendor profile with the new image URL
        setFormValues(prev => ({ ...prev, [type]: imageUrl }));
        setVendorProfile(prev => prev ? { ...prev, [type]: imageUrl } : null);
        
        // Save the change to the database
        await saveVendorProfile({ [type]: imageUrl });
        toast.success(`Imagem de ${type === 'logo' ? 'logo' : 'banner'} atualizada com sucesso`);
      } else {
        toast.error(`Erro ao enviar imagem de ${type === 'logo' ? 'logo' : 'banner'}`);
      }
    } catch (err) {
      console.error(`Error uploading ${type}:`, err);
      toast.error(`Erro ao fazer upload da imagem de ${type === 'logo' ? 'logo' : 'banner'}`);
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  if (loading) {
    return <LoadingState text="Carregando perfil do vendedor..." />;
  }

  if (error) {
    return (
      <ErrorState 
        title="Erro ao carregar perfil" 
        message={error} 
        onRetry={() => navigate(0)}
      />
    );
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Configurações da Loja</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Imagens da Loja</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo Upload */}
            <div>
              <Label htmlFor="logo">Logo da Loja</Label>
              <div className="mt-2">
                {vendorProfile?.logo && (
                  <div className="mb-4">
                    <img 
                      src={vendorProfile.logo} 
                      alt="Logo da loja" 
                      className="h-24 w-24 object-contain border rounded"
                    />
                  </div>
                )}
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'logo')}
                  disabled={uploading.logo}
                />
                {uploading.logo && <p className="text-sm mt-2">Enviando logo...</p>}
              </div>
            </div>
            
            {/* Banner Upload */}
            <div>
              <Label htmlFor="banner">Banner da Loja</Label>
              <div className="mt-2">
                {vendorProfile?.banner && (
                  <div className="mb-4">
                    <img 
                      src={vendorProfile.banner} 
                      alt="Banner da loja" 
                      className="h-32 w-full object-cover border rounded"
                    />
                  </div>
                )}
                <Input
                  id="banner"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'banner')}
                  disabled={uploading.banner}
                />
                {uploading.banner && <p className="text-sm mt-2">Enviando banner...</p>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informações da Loja</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome_loja">Nome da Loja *</Label>
                  <Input
                    id="nome_loja"
                    name="nome_loja"
                    value={formValues.nome_loja || ''}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="segmento">Segmento</Label>
                  <Input
                    id="segmento"
                    name="segmento"
                    value={formValues.segmento || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  name="descricao"
                  value={formValues.descricao || ''}
                  onChange={handleChange}
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="email">E-mail de Contato</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formValues.email || ''}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    name="telefone"
                    value={formValues.telefone || ''}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    name="whatsapp"
                    value={formValues.whatsapp || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(-1)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={saving}
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default ConfiguracoesVendorScreen;
