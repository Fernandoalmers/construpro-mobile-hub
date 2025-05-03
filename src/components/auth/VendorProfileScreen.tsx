import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Camera, Clock, MapPin, Truck, Upload } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from "@/components/ui/sonner";
import { useAuth, UserRole } from '../../context/AuthContext';
import { supabase } from "@/integrations/supabase/client";
import { OperatingHours, saveStore } from '@/services/storeService';

interface DeliveryMethod {
  id: string;
  label: string;
  checked: boolean;
}

interface DayHours {
  open: string;
  close: string;
  isOpen: boolean;
}

interface OperatingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

const defaultOperatingHours: OperatingHours = {
  monday: { open: "08:00", close: "18:00", isOpen: true },
  tuesday: { open: "08:00", close: "18:00", isOpen: true },
  wednesday: { open: "08:00", close: "18:00", isOpen: true },
  thursday: { open: "08:00", close: "18:00", isOpen: true },
  friday: { open: "08:00", close: "18:00", isOpen: true },
  saturday: { open: "08:00", close: "13:00", isOpen: true },
  sunday: { open: "00:00", close: "00:00", isOpen: false },
};

const VendorProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    nomeLoja: '',
    cnpj: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    descricao: '',
    logo: null as File | null,
    banner: null as File | null,
  });

  const [operatingHours, setOperatingHours] = useState<OperatingHours>(defaultOperatingHours);
  
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([
    { id: 'retirada', label: 'Retirada na loja', checked: true },
    { id: 'correios', label: 'Correios', checked: false },
    { id: 'propria', label: 'Entrega própria', checked: false },
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'logo' | 'banner') => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        [fileType]: e.target.files![0]
      }));
    }
  };

  const handleDayToggle = (day: keyof OperatingHours) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isOpen: !prev[day].isOpen
      }
    }));
  };
  
  const handleHoursChange = (
    day: keyof OperatingHours,
    type: 'open' | 'close',
    value: string
  ) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [type]: value
      }
    }));
  };

  const toggleDeliveryMethod = (id: string) => {
    setDeliveryMethods(prev => prev.map(method => 
      method.id === id ? { ...method, checked: !method.checked } : method
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nomeLoja || !formData.cnpj) {
      toast.error("Nome da loja e CNPJ são obrigatórios");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create store in database
      const selectedDeliveryMethods = deliveryMethods
        .filter(m => m.checked)
        .map(m => m.id);
      
      // Update user with vendor data
      await updateUser({ 
        papel: 'lojista' as UserRole
      });
      
      // Get updated user data to associate with store
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        // Create store
        const storeData = {
          nome: formData.nomeLoja,
          descricao: formData.descricao,
          endereco: {
            logradouro: formData.endereco,
            cidade: formData.cidade,
            estado: formData.estado,
            cep: formData.cep,
            full_address: `${formData.endereco}, ${formData.cidade} - ${formData.estado}, ${formData.cep}`
          },
          operating_hours: operatingHours,
          profile_id: userData.user.id
        };
        
        const storeResult = await saveStore(storeData);
        
        if (!storeResult) {
          throw new Error("Failed to create store");
        }
        
        // Upload logo if provided
        if (formData.logo) {
          const logoPath = `stores/${storeResult.id}/logo`;
          const { error: logoError } = await supabase.storage
            .from('store-images')
            .upload(logoPath, formData.logo, { upsert: true });
            
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
      }
      
      toast.success("Perfil de loja criado com sucesso!");
      navigate('/vendor');
    } catch (error) {
      console.error("Error creating store:", error);
      toast.error("Ocorreu um erro. Por favor, tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const dayNames: Record<keyof OperatingHours, string> = {
    monday: 'Segunda-feira',
    tuesday: 'Terça-feira',
    wednesday: 'Quarta-feira',
    thursday: 'Quinta-feira',
    friday: 'Sexta-feira',
    saturday: 'Sábado',
    sunday: 'Domingo'
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-white pb-8">
      <div className="bg-construPro-blue py-12 rounded-b-3xl">
        <div className="container mx-auto px-6">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center text-white mb-4"
          >
            <ArrowLeft size={20} className="mr-1" /> Voltar
          </button>
          <h1 className="text-2xl font-bold text-white">Cadastro da Loja</h1>
          <p className="text-white opacity-80 mt-2">
            Preencha os dados para configurar sua loja
          </p>
        </div>
      </div>

      <div className="flex-grow p-6 -mt-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700 flex items-center">
                <Camera size={18} className="mr-2" /> Identidade Visual
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="logo">Logo da Loja</Label>
                  <div className="mt-1">
                    <div 
                      className="w-full h-32 border border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50"
                      onClick={() => document.getElementById('logo')?.click()}
                    >
                      {formData.logo ? (
                        <img 
                          src={URL.createObjectURL(formData.logo)} 
                          alt="Logo preview" 
                          className="h-full w-full object-contain rounded-lg"
                        />
                      ) : (
                        <div className="text-center">
                          <Upload size={24} className="mx-auto text-gray-400" />
                          <p className="text-xs text-gray-500 mt-1">Logo da loja</p>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      id="logo"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'logo')}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="banner">Banner</Label>
                  <div className="mt-1">
                    <div 
                      className="w-full h-32 border border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50"
                      onClick={() => document.getElementById('banner')?.click()}
                    >
                      {formData.banner ? (
                        <img 
                          src={URL.createObjectURL(formData.banner)} 
                          alt="Banner preview" 
                          className="h-full w-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="text-center">
                          <Upload size={24} className="mx-auto text-gray-400" />
                          <p className="text-xs text-gray-500 mt-1">Banner da loja</p>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      id="banner"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'banner')}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700 flex items-center">
                Informações da Loja
              </h3>
              
              <div>
                <Label htmlFor="nomeLoja">Nome da Loja *</Label>
                <Input
                  id="nomeLoja"
                  name="nomeLoja"
                  value={formData.nomeLoja}
                  onChange={handleInputChange}
                  placeholder="Nome comercial da sua loja"
                  className="mt-1"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  name="cnpj"
                  value={formData.cnpj}
                  onChange={handleInputChange}
                  placeholder="00.000.000/0000-00"
                  className="mt-1"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Seu CNPJ é necessário para emissão de notas fiscais
                </p>
              </div>
              
              <div>
                <Label htmlFor="descricao">Descrição da Loja</Label>
                <Textarea
                  id="descricao"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  placeholder="Descreva sua loja, produtos e diferenciais..."
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700 flex items-center">
                <MapPin size={18} className="mr-2" /> Endereço
              </h3>
              
              <div>
                <Label htmlFor="endereco">Endereço Comercial *</Label>
                <Input
                  id="endereco"
                  name="endereco"
                  value={formData.endereco}
                  onChange={handleInputChange}
                  placeholder="Rua, número, complemento"
                  className="mt-1"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cidade">Cidade *</Label>
                  <Input
                    id="cidade"
                    name="cidade"
                    value={formData.cidade}
                    onChange={handleInputChange}
                    placeholder="Cidade"
                    className="mt-1"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="estado">Estado *</Label>
                  <Input
                    id="estado"
                    name="estado"
                    value={formData.estado}
                    onChange={handleInputChange}
                    placeholder="Estado"
                    className="mt-1"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="cep">CEP *</Label>
                <Input
                  id="cep"
                  name="cep"
                  value={formData.cep}
                  onChange={handleInputChange}
                  placeholder="00000-000"
                  className="mt-1"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700 flex items-center">
                <Clock size={18} className="mr-2" /> Horário de Funcionamento
              </h3>
              
              <div className="space-y-3">
                {Object.entries(dayNames).map(([day, label]) => {
                  const dayKey = day as keyof OperatingHours;
                  const dayData = operatingHours[dayKey];
                  
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
            
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700 flex items-center">
                <Truck size={18} className="mr-2" /> Opções de Entrega
              </h3>
              
              <div className="space-y-2">
                {deliveryMethods.map(method => (
                  <div key={method.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={method.id}
                      checked={method.checked}
                      onCheckedChange={() => toggleDeliveryMethod(method.id)}
                    />
                    <Label 
                      htmlFor={method.id}
                      className="text-base cursor-pointer"
                    >
                      {method.label}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Selecione todas as formas de entrega que sua loja oferece
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-construPro-orange hover:bg-orange-600 text-white mt-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : 'Finalizar cadastro'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VendorProfileScreen;
