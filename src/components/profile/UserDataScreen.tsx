
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Save } from 'lucide-react';
import Card from '../common/Card';
import CustomInput from '../common/CustomInput';
import CustomButton from '../common/CustomButton';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '../../context/AuthContext';

// Opções de especialidade para profissionais
const specialtyOptions = [
  { value: 'pedreiro', label: 'Pedreiro' },
  { value: 'eletricista', label: 'Eletricista' },
  { value: 'encanador', label: 'Encanador' },
  { value: 'pintor', label: 'Pintor' },
  { value: 'marceneiro', label: 'Marceneiro' },
  { value: 'serralheiro', label: 'Serralheiro' },
  { value: 'azulejista', label: 'Azulejista' },
  { value: 'vidraceiro', label: 'Vidraceiro' },
  { value: 'jardineiro', label: 'Jardineiro' },
  { value: 'outro', label: 'Outro' },
];

const UserDataScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    nome: user?.nome || '',
    email: user?.email || '',
    cpfCnpj: user?.cpf || '',
    telefone: user?.telefone || '',
    endereco: '',
    cidade: '',
    estado: '',
    especialidade: '',
  });
  
  const [loading, setLoading] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateUser({
        nome: formData.nome,
        email: formData.email,
        cpf: formData.cpfCnpj,
        telefone: formData.telefone,
      });
      
      toast.success('Dados atualizados com sucesso!');
      navigate('/profile');
    } catch (error) {
      toast.error('Erro ao atualizar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  const isProfessional = user?.papel === 'profissional';
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-construPro-blue p-6 pt-12">
        <div className="flex items-center mb-4">
          <button onClick={() => navigate('/profile')} className="text-white">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-white ml-2">Meus Dados</h1>
        </div>
      </div>
      
      {/* Form */}
      <div className="p-6">
        <Card className="p-4">
          <h2 className="font-medium mb-4 flex items-center">
            <User size={18} className="mr-2 text-construPro-blue" />
            Dados Pessoais
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome completo</Label>
              <CustomInput
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="email">E-mail</Label>
              <CustomInput
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
              <CustomInput
                id="cpfCnpj"
                name="cpfCnpj"
                value={formData.cpfCnpj}
                onChange={handleChange}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <CustomInput
                id="telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="endereco">Endereço</Label>
              <CustomInput
                id="endereco"
                name="endereco"
                value={formData.endereco}
                onChange={handleChange}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <CustomInput
                  id="cidade"
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="estado">Estado</Label>
                <CustomInput
                  id="estado"
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            {isProfessional && (
              <div>
                <Label htmlFor="especialidade">Especialidade principal</Label>
                <Select 
                  value={formData.especialidade} 
                  onValueChange={(value) => handleSelectChange('especialidade', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione sua especialidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialtyOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <CustomButton
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              icon={<Save size={18} />}
            >
              Salvar alterações
            </CustomButton>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default UserDataScreen;
