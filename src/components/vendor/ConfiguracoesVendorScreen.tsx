
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, ExternalLink, Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import CustomButton from '../common/CustomButton';
import lojas from '../../data/lojas.json';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';

interface StoreFormValues {
  nome: string;
  descricao: string;
  endereco: string;
  horarioAtendimento: string;
  whatsapp: string;
  formasEntrega: {
    entregaPropria: boolean;
    correios: boolean;
    retirada: boolean;
  };
  categorias: string[];
}

const ConfiguracoesVendorScreen: React.FC = () => {
  const navigate = useNavigate();
  
  // Simulate logged-in vendor's store
  const currentLojaId = "1"; // Just for simulation purposes
  const currentLoja = lojas.find(loja => loja.id === currentLojaId);
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(currentLoja?.logoUrl || '');
  
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>('https://images.unsplash.com/photo-1487958449943-2429e8be8625?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&h=250&q=80');
  
  const availableCategories = [
    "Ferramentas", "Materiais", "Elétrica", "Hidráulica", 
    "Tintas", "Acabamentos", "Máquinas", "EPI"
  ];
  
  const form = useForm<StoreFormValues>({
    defaultValues: {
      nome: currentLoja?.nome || '',
      descricao: currentLoja?.descricao || '',
      endereco: currentLoja?.endereco || '',
      horarioAtendimento: '08:00 - 18:00 (Seg a Sáb)',
      whatsapp: currentLoja?.contato || '',
      formasEntrega: {
        entregaPropria: true,
        correios: true,
        retirada: true
      },
      categorias: currentLoja?.categorias || []
    }
  });

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

  const onSubmit = (data: StoreFormValues) => {
    // In a real app, this would update the store info in the database
    console.log("Form data:", data);
    console.log("Logo file:", logoFile);
    console.log("Banner file:", bannerFile);
    
    toast({
      title: "Configurações salvas!",
      description: "As alterações na sua loja foram salvas com sucesso."
    });
  };

  const handleViewStore = () => {
    // In a real app, this would navigate to the public store page
    navigate(`/marketplace/loja/${currentLojaId}`);
  };

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
                          src={logoPreview} 
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="horarioAtendimento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horário de atendimento</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: 08:00 - 18:00 (Seg a Sáb)" />
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
                      <input
                        type="checkbox"
                        id="entregaPropria"
                        checked={form.getValues('formasEntrega').entregaPropria}
                        onChange={() => handleDeliveryToggle('entregaPropria')}
                        className="mr-2 h-4 w-4"
                      />
                      <label htmlFor="entregaPropria">Entrega própria</label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="correios"
                        checked={form.getValues('formasEntrega').correios}
                        onChange={() => handleDeliveryToggle('correios')}
                        className="mr-2 h-4 w-4"
                      />
                      <label htmlFor="correios">Correios</label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="retirada"
                        checked={form.getValues('formasEntrega').retirada}
                        onChange={() => handleDeliveryToggle('retirada')}
                        className="mr-2 h-4 w-4"
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
              >
                Salvar alterações
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
