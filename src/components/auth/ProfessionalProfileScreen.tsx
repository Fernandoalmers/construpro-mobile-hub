
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Camera, Upload } from 'lucide-react';
import { toast } from "@/components/ui/sonner";
import CustomSelect from '../common/CustomSelect';
import CustomInput from '../common/CustomInput';
import { useAuth } from '../../context/AuthContext';

const especialidades = [
  { value: 'pedreiro', label: 'Pedreiro' },
  { value: 'pintor', label: 'Pintor' },
  { value: 'eletricista', label: 'Eletricista' },
  { value: 'encanador', label: 'Encanador' },
  { value: 'marceneiro', label: 'Marceneiro' },
  { value: 'gesseiro', label: 'Gesseiro' },
  { value: 'arquiteto', label: 'Arquiteto' },
  { value: 'engenheiro', label: 'Engenheiro Civil' },
  { value: 'designer', label: 'Designer de Interiores' },
  { value: 'outro', label: 'Outro' },
];

const ProfessionalProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    especialidade: '',
    cidade: '',
    whatsapp: '',
    portfolio: [] as File[],
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setFormData(prev => ({
        ...prev,
        portfolio: [...prev.portfolio, ...filesArray].slice(0, 5), // Limit to 5 files
      }));
    }
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      portfolio: prev.portfolio.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.especialidade || !formData.cidade) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Update user with professional data
      await updateUser({
        // Add professional data
      });
      
      toast.success("Perfil profissional criado com sucesso!");
      
      // If user also selected lojista, go to vendor profile
      if (location.state?.selectedProfiles?.includes('lojista')) {
        navigate('/auth/vendor-profile');
      } else {
        navigate('/home');
      }
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
          <h1 className="text-2xl font-bold text-white">Perfil Profissional</h1>
          <p className="text-white opacity-80 mt-2">
            Complete seu perfil para começar a receber propostas
          </p>
        </div>
      </div>

      <div className="flex-grow p-6 -mt-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <CustomSelect
                label="Especialidade *"
                options={especialidades}
                value={formData.especialidade}
                onChange={(value) => setFormData(prev => ({ ...prev, especialidade: value }))}
                placeholder="Selecione sua especialidade"
              />
              <p className="text-xs text-gray-500 mt-1">
                Escolha a especialidade que melhor representa seu trabalho
              </p>
            </div>

            <div>
              <Label htmlFor="cidade">Cidade de atuação *</Label>
              <Input
                id="cidade"
                name="cidade"
                value={formData.cidade}
                onChange={handleInputChange}
                placeholder="Ex: São Paulo - SP"
                className="mt-1"
                required
              />
            </div>

            <div>
              <CustomInput
                label="WhatsApp (opcional)"
                id="whatsapp"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleInputChange}
                placeholder="(00) 00000-0000"
              />
              <p className="text-xs text-gray-500 mt-1">
                Facilite o contato com potenciais clientes
              </p>
            </div>

            <div>
              <Label>Portfólio (opcional)</Label>
              <div className="mt-1">
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="portfolio"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Clique para enviar</span> ou arraste as fotos
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF (MAX. 5 MB por foto)
                      </p>
                    </div>
                    <input
                      id="portfolio"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                
                {formData.portfolio.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {formData.portfolio.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Portfolio ${index + 1}`}
                          className="h-24 w-full object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Adicione fotos dos seus trabalhos para atrair mais clientes
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-construPro-orange hover:bg-orange-600 text-white mt-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar e continuar'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalProfileScreen;
