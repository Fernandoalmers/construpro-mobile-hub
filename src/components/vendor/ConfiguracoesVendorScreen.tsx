
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, ExternalLink, Upload, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import CustomButton from '../common/CustomButton';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/context/AuthContext';
import { Checkbox } from '@/components/ui/checkbox';

interface StoreFormValues {
  nome: string;
  descricao: string;
  endereco: string;
  whatsapp: string;
  formasEntrega: {
    entregaPropria: boolean;
    correios: boolean;
    retirada: boolean;
  };
  categorias: string[];
  operatingHours: {
    monday: { open: string; close: string; isOpen: boolean };
    tuesday: { open: string; close: string; isOpen: boolean };
    wednesday: { open: string; close: string; isOpen: boolean };
    thursday: { open: string; close: string; isOpen: boolean };
    friday: { open: string; close: string; isOpen: boolean };
    saturday: { open: string; close: string; isOpen: boolean };
    sunday: { open: string; close: string; isOpen: boolean };
  };
}

interface DayHours {
  open: string;
  close: string;
  isOpen: boolean;
}

const defaultOperatingHours = {
  monday: { open: "08:00", close: "18:00", isOpen: true },
  tuesday: { open: "08:00", close: "18:00", isOpen: true },
  wednesday: { open: "08:00", close: "18:00", isOpen: true },
  thursday: { open: "08:00", close: "18:00", isOpen: true },
  friday: { open: "08:00", close: "18:00", isOpen: true },
  saturday: { open: "08:00", close: "13:00", isOpen: true },
  sunday: { open: "00:00", close: "00:00", isOpen: false },
};

const ConfiguracoesVendorScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [storeId, setStoreId] = useState<string | null>(null);
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>('https://images.unsplash.com/photo-1487958449943-2429e8be8625?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&h=250&q=80');
  
  const availableCategories = [
    "Ferramentas", "Materiais", "Elétrica", "Hidráulica", 
    "Tintas", "Acabamentos", "Máquinas", "EPI"
  ];
  
  const form = useForm<StoreFormValues>({
    defaultValues: {
      nome: '',
      descricao: '',
      endereco: '',
      whatsapp: '',
      formasEntrega: {
        entregaPropria: true,
        correios: true,
        retirada: true
      },
      categorias: [],
      operatingHours: defaultOperatingHours
    }
  });

  // Fetch store data on component mount
  useEffect(() => {
    const fetchStoreData = async () => {
      if (!user?.id) return;
      
      try {
        const { data: storeData, error } = await supabase
          .from('stores')
          .select('*')
          .eq('profile_id', user.id)
          .single();
          
        if (error) {
          console.error('Error fetching store data:', error);
          setLoading(false);
          return;
        }
        
        if (storeData) {
          setStoreId(storeData.id);
          
          // Set form values from store data
          form.setValue('nome', storeData.nome || '');
          form.setValue('descricao', storeData.descricao || '');
          form.setValue('endereco', storeData.endereco?.full_address || '');
          form.setValue('whatsapp', storeData.contato || '');
          
          // Handle operating hours
          if (storeData.operating_hours) {
            form.setValue('operatingHours', storeData.operating_hours);
          }
          
          // Set logo preview if available
          if (storeData.logo_url) {
            setLogoPreview(storeData.logo_url);
          }
        }
      } catch (error) {
        console.error('Error in store fetch:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStoreData();
  }, [user, form]);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };
  
  const handleBannerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };
  
  const handleCategoryToggle = (category: string) => {
    const currentCategories = form.getValues('categorias');
    if (currentCategories.includes(category)) {
      form.setValue('categorias', currentCategories.filter(c => c !== category));
    } else {
      form.setValue('categorias', [...currentCategories, category]);
    }
  };
  
  const handleDeliveryToggle = (method: keyof StoreFormValues['formasEntrega']) => {
    const currentValue = form.getValues('formasEntrega')[method];
    form.setValue(`formasEntrega.${method}`, !currentValue);
  };

  const handleDayToggle = (day: keyof StoreFormValues['operatingHours']) => {
    const currentValue = form.getValues('operatingHours')[day];
    form.setValue(`operatingHours.${day}`, {
      ...currentValue,
      isOpen: !currentValue.isOpen
    });
  };
  
  const handleHoursChange = (
    day: keyof StoreFormValues['operatingHours'],
    type: 'open' | 'close',
    value: string
  ) => {
    const currentValue = form.getValues('operatingHours')[day];
    form.setValue(`operatingHours.${day}`, {
      ...currentValue,
      [type]: value
    });
  };

  const onSubmit = async (data: StoreFormValues) => {
    try {
      setLoading(true);
      
      // Create or update store data
      const storeData = {
        nome: data.nome,
        descricao: data.descricao,
        endereco: { full_address: data.endereco },
        contato: data.whatsapp,
        operating_hours: data.operatingHours,
        profile_id: user?.id
      };
      
      let storeResult;
      
      if (storeId) {
        // Update existing store
        const { data: updatedStore, error } = await supabase
          .from('stores')
          .update(storeData)
          .eq('id', storeId)
          .select()
          .single();
          
        if (error) throw error;
        storeResult = updatedStore;
      } else {
        // Create new store
        const { data: newStore, error } = await supabase
          .from('stores')
          .insert(storeData)
          .select()
          .single();
          
        if (error) throw error;
        storeResult = newStore;
        setStoreId(newStore.id);
      }
      
      // Upload logo if changed
      if (logoFile) {
        const logoPath = `stores/${storeResult.id}/logo`;
        const { error: logoError } = await supabase.storage
          .from('store-images')
          .upload(logoPath, logoFile, { upsert: true });
          
        if (logoError) throw logoError;
        
        // Get public URL for logo
        const { data: logoData } = supabase.storage
          .from('store-images')
          .getPublicUrl(logoPath);
          
        // Update store with logo URL
        await supabase
          .from('stores')
          .update({ logo_url: logoData.publicUrl })
          .eq('id', storeResult.id);
      }
      
      toast({
        title: "Configurações salvas!",
        description: "As alterações na sua loja foram salvas com sucesso."
      });
      
    } catch (error) {
      console.error('Error saving store data:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar as configurações da loja.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewStore = () => {
    if (storeId) {
      navigate(`/marketplace/loja/${storeId}`);
    } else {
      toast({
        title: "Loja não encontrada",
        description: "Salve as configurações da loja primeiro."
      });
    }
  };

  const dayNames: Record<keyof StoreFormValues['operatingHours'], string> = {
    monday: 'Segunda-feira',
    tuesday: 'Terça-feira',
    wednesday: 'Quarta-feira',
    thursday: 'Quinta-feira',
    friday: 'Sexta-feira',
    saturday: 'Sábado',
    sunday: 'Domingo'
  };

  if (loading && !form.formState.isSubmitting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-construPro-blue mx-auto"></div>
          <p className="mt-4">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-white p-4 flex items-center shadow-sm">
        <button onClick={() => navigate('/vendor')} className="mr-4">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Configurações da Loja</h1>
      </div>
      
      <div className="p-6 space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Banner and Logo */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div>
                    <FormLabel>Banner da loja</FormLabel>
                    <div className="mt-2 relative">
                      <img 
                        src={bannerPreview} 
                        alt="Banner da loja" 
                        className="w-full h-40 object-cover rounded-md"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                        <label className="cursor-pointer bg-white text-gray-800 px-3 py-2 rounded-full flex items-center">
                          <Upload size={16} className="mr-2" />
                          Alterar banner
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleBannerChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Tamanho recomendado: 1200 x 250px</p>
                  </div>
                  
                  <div>
                    <FormLabel>Logotipo</FormLabel>
                    <div className="mt-2 flex items-center">
                      <div className="relative">
                        <img 
                          src={logoPreview || 'https://via.placeholder.com/200'} 
                          alt="Logotipo" 
                          className="w-20 h-20 object-cover rounded-md"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity rounded-md">
                          <label className="cursor-pointer bg-white text-gray-800 p-1 rounded-full">
                            <Upload size={14} />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="font-medium">Alterar logotipo</p>
                        <p className="text-xs text-gray-500">Tamanho recomendado: 200 x 200px</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Basic Info */}
            <Card>
              <CardContent className="pt-6 space-y-6">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da loja</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Casa do Construtor" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Descreva sua loja em até 300 caracteres" 
                          maxLength={300}
                          className="resize-none h-24"
                        />
                      </FormControl>
                      <div className="text-xs text-gray-500 text-right mt-1">
                        {field.value.length}/300 caracteres
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endereco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço físico</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Av. Paulista, 1500, São Paulo - SP" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp para contato</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: (11) 98765-4321" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            {/* Operating Hours */}
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <FormLabel className="flex items-center">
                    <Clock size={18} className="mr-2" /> Horário de Funcionamento
                  </FormLabel>
                  <div className="mt-4 space-y-3">
                    {Object.entries(dayNames).map(([day, label]) => {
                      const dayKey = day as keyof StoreFormValues['operatingHours'];
                      const dayData = form.getValues('operatingHours')[dayKey];
                      
                      return (
                        <div key={day} className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center min-w-[180px]">
                            <Checkbox 
                              id={`day-${day}`}
                              checked={dayData.isOpen}
                              onCheckedChange={() => handleDayToggle(dayKey)}
                              className="mr-2"
                            />
                            <label htmlFor={`day-${day}`} className="text-sm font-medium">
                              {label}
                            </label>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Input 
                              type="time" 
                              value={dayData.open}
                              onChange={(e) => handleHoursChange(dayKey, 'open', e.target.value)}
                              disabled={!dayData.isOpen}
                              className="w-24"
                            />
                            <span>até</span>
                            <Input 
                              type="time" 
                              value={dayData.close}
                              onChange={(e) => handleHoursChange(dayKey, 'close', e.target.value)}
                              disabled={!dayData.isOpen}
                              className="w-24"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Categories and Delivery */}
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <FormLabel>Categorias de produtos</FormLabel>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {availableCategories.map(category => {
                      const isSelected = form.getValues('categorias').includes(category);
                      return (
                        <button
                          type="button"
                          key={category}
                          onClick={() => handleCategoryToggle(category)}
                          className={`px-3 py-1 rounded-full text-sm ${
                            isSelected
                              ? 'bg-construPro-blue text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {category}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <FormLabel>Formas de entrega disponíveis</FormLabel>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center">
                      <Checkbox
                        id="entregaPropria"
                        checked={form.getValues('formasEntrega').entregaPropria}
                        onCheckedChange={() => handleDeliveryToggle('entregaPropria')}
                        className="mr-2"
                      />
                      <label htmlFor="entregaPropria">Entrega própria</label>
                    </div>
                    
                    <div className="flex items-center">
                      <Checkbox
                        id="correios"
                        checked={form.getValues('formasEntrega').correios}
                        onCheckedChange={() => handleDeliveryToggle('correios')}
                        className="mr-2"
                      />
                      <label htmlFor="correios">Correios</label>
                    </div>
                    
                    <div className="flex items-center">
                      <Checkbox
                        id="retirada"
                        checked={form.getValues('formasEntrega').retirada}
                        onCheckedChange={() => handleDeliveryToggle('retirada')}
                        className="mr-2"
                      />
                      <label htmlFor="retirada">Retirada no local</label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <CustomButton 
                type="submit" 
                variant="primary"
                icon={<Save size={18} />}
                fullWidth
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Salvando...' : 'Salvar alterações'}
              </CustomButton>
              
              <CustomButton
                type="button"
                variant="outline"
                onClick={handleViewStore}
                icon={<ExternalLink size={18} />}
                fullWidth
              >
                Visualizar loja
              </CustomButton>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ConfiguracoesVendorScreen;
