
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Camera, Clock, MapPin, Truck, Upload } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from "@/components/ui/sonner";
import { useAuth } from '../../context/AuthContext';

interface DeliveryMethod {
  id: string;
  label: string;
  checked: boolean;
}

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
    horarioAbertura: '',
    horarioFechamento: '',
    descricao: '',
    logo: null as File | null,
    banner: null as File | null,
  });
  
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
      // In a real app, we would upload files and save store data
      const selectedDeliveryMethods = deliveryMethods
        .filter(m => m.checked)
        .map(m => m.id);
      
      // Update user with vendor data
      await updateUser({ 
        papel: 'lojista'
        // Add vendor data in a real app
      });
      
      toast.success("Perfil de loja criado com sucesso!");
      navigate('/vendor');
    } catch (error) {
      toast.error("Ocorreu um erro. Por favor, tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
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
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="horarioAbertura">Abertura *</Label>
                  <Input
                    id="horarioAbertura"
                    name="horarioAbertura"
                    type="time"
                    value={formData.horarioAbertura}
                    onChange={handleInputChange}
                    className="mt-1"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="horarioFechamento">Fechamento *</Label>
                  <Input
                    id="horarioFechamento"
                    name="horarioFechamento"
                    type="time"
                    value={formData.horarioFechamento}
                    onChange={handleInputChange}
                    className="mt-1"
                    required
                  />
                </div>
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
