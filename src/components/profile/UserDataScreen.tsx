import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Save, Search } from 'lucide-react';
import Card from '../common/Card';
import CustomInput from '../common/CustomInput';
import CustomButton from '../common/CustomButton';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '../../context/AuthContext';
import { useMutation } from '@tanstack/react-query';
import { useEnhancedCepLookup } from '@/hooks/useEnhancedCepLookup';
import { formatCep } from '@/lib/cep';
import EnhancedCepErrorDisplay from '@/components/common/EnhancedCepErrorDisplay';

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
  const { profile, updateProfile } = useAuth();
  const { isLoading: cepLoading, error: cepError, cepData, lookupAddress, clearData, retryLookup, lastSearchedCep } = useEnhancedCepLookup();
  
  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cpf: '',
    telefone: '',
    especialidade: '',
    endereco: {
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: ''
    }
  });
  
  // Show debugging information
  useEffect(() => {
    console.log('Profile loaded in UserDataScreen:', profile);
  }, [profile]);

  // Carregar dados do perfil quando o componente montar
  useEffect(() => {
    if (profile) {
      setFormData({
        nome: profile.nome || '',
        email: profile.email || '',
        cpf: profile.cpf || '',
        telefone: profile.telefone || '',
        especialidade: '',
        endereco: {
          logradouro: profile.endereco_principal?.logradouro || '',
          numero: profile.endereco_principal?.numero || '',
          complemento: profile.endereco_principal?.complemento || '',
          bairro: profile.endereco_principal?.bairro || '',
          cidade: profile.endereco_principal?.cidade || '',
          estado: profile.endereco_principal?.estado || '',
          cep: profile.endereco_principal?.cep || ''
        }
      });
    }
  }, [profile]);
  
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Updating profile with data:', data);
      return updateProfile(data);
    },
    onSuccess: () => {
      toast.success('Dados atualizados com sucesso');
      navigate('/profile');
    },
    onError: (error: any) => {
      console.error('Error updating profile:', error);
      toast.error(`Erro ao atualizar dados: ${error.message || 'Erro desconhecido'}`);
    }
  });
  
  const [isCepSearching, setIsCepSearching] = useState(false);

  // Auto-fill address fields when CEP data is found
  useEffect(() => {
    if (cepData) {
      console.log('[UserDataScreen] Auto-filling address fields with enhanced data:', cepData);
      setFormData(prev => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          logradouro: cepData.logradouro || '',
          bairro: cepData.bairro || '',
          cidade: cepData.localidade || '',
          estado: cepData.uf || ''
        }
      }));
    }
  }, [cepData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Check if it's an address field
    if (name.startsWith('endereco.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCepInputChange = (value: string) => {
    const formatted = formatCep(value);
    setFormData(prev => ({
      ...prev,
      endereco: {
        ...prev.endereco,
        cep: value.replace(/\D/g, '')
      }
    }));
    
    const sanitizedCep = value.replace(/\D/g, '');
    if (sanitizedCep.length < 8) {
      clearData();
    }
  };

  const handleCepSearch = async () => {
    if (!formData.endereco.cep.trim()) {
      console.warn('[UserDataScreen] Empty CEP input');
      return;
    }
    
    console.log('[UserDataScreen] Searching CEP with enhanced system:', formData.endereco.cep);
    const sanitizedCep = formData.endereco.cep.replace(/\D/g, '');
    
    if (sanitizedCep.length !== 8) {
      console.warn('[UserDataScreen] Invalid CEP length:', sanitizedCep.length);
      return;
    }

    setIsCepSearching(true);
    const data = await lookupAddress(sanitizedCep);
    setIsCepSearching(false);
    
    if (data) {
      console.log('[UserDataScreen] Enhanced CEP found and saved:', sanitizedCep, data);
      toast.success(`CEP encontrado: ${data.localidade}-${data.uf}`);
    }
  };

  const handleCepRetry = async () => {
    console.log('[UserDataScreen] Retrying with enhanced system...');
    await retryLookup();
  };

  const handleCepManualEntry = () => {
    console.log('[UserDataScreen] Showing manual entry');
    clearData();
  };

  const handleCepSuggestion = async (suggestedCep: string) => {
    console.log('[UserDataScreen] Using suggested CEP:', suggestedCep);
    setFormData(prev => ({
      ...prev,
      endereco: {
        ...prev.endereco,
        cep: suggestedCep
      }
    }));
    await lookupAddress(suggestedCep);
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    
    updateProfileMutation.mutate({
      nome: formData.nome,
      cpf: formData.cpf,
      telefone: formData.telefone,
      endereco_principal: {
        logradouro: formData.endereco.logradouro,
        numero: formData.endereco.numero,
        complemento: formData.endereco.complemento,
        bairro: formData.endereco.bairro,
        cidade: formData.endereco.cidade,
        estado: formData.endereco.estado,
        cep: formData.endereco.cep
      }
    });
  };
  
  const isProfessional = profile?.tipo_perfil === 'profissional';
  
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
                disabled={true}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                O e-mail não pode ser alterado.
              </p>
            </div>
            
            <div>
              <Label htmlFor="cpf">CPF/CNPJ</Label>
              <CustomInput
                id="cpf"
                name="cpf"
                value={formData.cpf}
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
              <Label htmlFor="endereco.logradouro">Endereço</Label>
              <CustomInput
                id="endereco.logradouro"
                name="endereco.logradouro"
                value={formData.endereco.logradouro}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="endereco.numero">Número</Label>
                <CustomInput
                  id="endereco.numero"
                  name="endereco.numero"
                  value={formData.endereco.numero}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="endereco.complemento">Complemento</Label>
                <CustomInput
                  id="endereco.complemento"
                  name="endereco.complemento"
                  value={formData.endereco.complemento}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="endereco.bairro">Bairro</Label>
              <CustomInput
                id="endereco.bairro"
                name="endereco.bairro"
                value={formData.endereco.bairro}
                onChange={handleChange}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="endereco.cidade">Cidade</Label>
                <CustomInput
                  id="endereco.cidade"
                  name="endereco.cidade"
                  value={formData.endereco.cidade}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="endereco.estado">Estado</Label>
                <CustomInput
                  id="endereco.estado"
                  name="endereco.estado"
                  value={formData.endereco.estado}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="endereco.cep">CEP</Label>
              <div className="flex gap-2">
                <CustomInput
                  id="endereco.cep"
                  name="endereco.cep"
                  value={formatCep(formData.endereco.cep)}
                  onChange={(e) => handleCepInputChange(e.target.value)}
                  placeholder="00000-000"
                  maxLength={9}
                />
                <Button
                  type="button"
                  onClick={handleCepSearch}
                  disabled={cepLoading || isCepSearching || formData.endereco.cep.replace(/\D/g, '').length !== 8}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  {(cepLoading || isCepSearching) ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Buscar
                </Button>
              </div>
              
              {cepError && (
                <div className="mt-2">
                  <EnhancedCepErrorDisplay
                    error={cepError}
                    onRetry={handleCepRetry}
                    onManualEntry={handleCepManualEntry}
                    onCepSuggestion={handleCepSuggestion}
                    isRetrying={cepLoading || isCepSearching}
                    searchedCep={lastSearchedCep || undefined}
                  />
                </div>
              )}
              
              {cepData && (
                <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                  <p className="text-sm text-green-700">
                    ✅ CEP encontrado com sistema aprimorado: {cepData.localidade} - {cepData.uf}
                    {cepData.source && <span className="text-xs ml-1">(fonte: {cepData.source})</span>}
                    {cepData.confidence && <span className="text-xs ml-1">- confiança: {cepData.confidence}</span>}
                  </p>
                </div>
              )}
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
              disabled={updateProfileMutation.isPending}
              className="w-full"
            >
              {updateProfileMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save size={18} />
                  Salvar Dados
                </div>
              )}
            </CustomButton>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default UserDataScreen;
