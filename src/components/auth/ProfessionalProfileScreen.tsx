
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

const ProfessionalProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: profile?.nome || '',
    especialidade: '',
    telefone: profile?.telefone || '',
    cidade: '',
    estado: '',
    sobre: '',
    area_atuacao: '',
    especialidades: [] as string[]
  });

  const especialidadesDisponiveis = [
    'Pedreiro',
    'Eletricista',
    'Encanador',
    'Pintor',
    'Marceneiro',
    'Soldador',
    'Serralheiro',
    'Azulejista',
    'Gesseiro',
    'Carpinteiro',
    'Vidraceiro',
    'Jardineiro',
    'Arquiteto',
    'Engenheiro Civil',
    'Mestre de Obras',
    'Técnico em Edificações'
  ];

  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
    'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
    'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEspecialidadeToggle = (especialidade: string) => {
    setFormData(prev => ({
      ...prev,
      especialidades: prev.especialidades.includes(especialidade)
        ? prev.especialidades.filter(e => e !== especialidade)
        : [...prev.especialidades, especialidade]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.especialidade || !formData.telefone || !formData.cidade || !formData.estado) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setIsLoading(true);

    try {
      // Atualizar o perfil do usuário
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          nome: formData.nome,
          telefone: formData.telefone,
          papel: 'profissional',
          tipo_perfil: 'profissional'
        })
        .eq('id', profile?.id);

      if (profileError) {
        throw profileError;
      }

      // Criar registro na tabela de profissionais
      const { error: professionalError } = await supabase
        .from('professionals')
        .insert({
          profile_id: profile?.id,
          nome: formData.nome,
          especialidade: formData.especialidade,
          especialidades: formData.especialidades,
          telefone: formData.telefone,
          cidade: formData.cidade,
          estado: formData.estado,
          sobre: formData.sobre,
          area_atuacao: formData.area_atuacao
        });

      if (professionalError) {
        throw professionalError;
      }

      // Atualizar o contexto
      await refreshProfile();

      toast.success('Perfil profissional criado com sucesso!');
      navigate('/home');
    } catch (error) {
      console.error('Erro ao criar perfil profissional:', error);
      toast.error('Erro ao criar perfil profissional. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-construPro-blue">
              Complete seu Perfil Profissional
            </CardTitle>
            <CardDescription>
              Preencha as informações abaixo para completar seu cadastro como profissional
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nome completo */}
              <div>
                <Label htmlFor="nome" className="text-sm font-medium">
                  Nome Completo *
                </Label>
                <Input
                  id="nome"
                  type="text"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  placeholder="Digite seu nome completo"
                  required
                />
              </div>

              {/* Especialidade principal */}
              <div>
                <Label htmlFor="especialidade" className="text-sm font-medium">
                  Especialidade Principal *
                </Label>
                <Select 
                  value={formData.especialidade} 
                  onValueChange={(value) => handleInputChange('especialidade', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione sua especialidade principal" />
                  </SelectTrigger>
                  <SelectContent>
                    {especialidadesDisponiveis.map((esp) => (
                      <SelectItem key={esp} value={esp}>
                        {esp}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Especialidades adicionais */}
              <div>
                <Label className="text-sm font-medium">
                  Especialidades Adicionais
                </Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {especialidadesDisponiveis.map((esp) => (
                    <label key={esp} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.especialidades.includes(esp)}
                        onChange={() => handleEspecialidadeToggle(esp)}
                        className="rounded border-gray-300"
                      />
                      <span>{esp}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Telefone */}
              <div>
                <Label htmlFor="telefone" className="text-sm font-medium">
                  Telefone *
                </Label>
                <Input
                  id="telefone"
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange('telefone', e.target.value)}
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>

              {/* Cidade e Estado */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cidade" className="text-sm font-medium">
                    Cidade *
                  </Label>
                  <Input
                    id="cidade"
                    type="text"
                    value={formData.cidade}
                    onChange={(e) => handleInputChange('cidade', e.target.value)}
                    placeholder="Digite sua cidade"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="estado" className="text-sm font-medium">
                    Estado *
                  </Label>
                  <Select 
                    value={formData.estado} 
                    onValueChange={(value) => handleInputChange('estado', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {estados.map((estado) => (
                        <SelectItem key={estado} value={estado}>
                          {estado}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sobre */}
              <div>
                <Label htmlFor="sobre" className="text-sm font-medium">
                  Sobre Você
                </Label>
                <Textarea
                  id="sobre"
                  value={formData.sobre}
                  onChange={(e) => handleInputChange('sobre', e.target.value)}
                  placeholder="Conte um pouco sobre sua experiência e qualificações..."
                  rows={4}
                />
              </div>

              {/* Área de atuação */}
              <div>
                <Label htmlFor="area_atuacao" className="text-sm font-medium">
                  Área de Atuação
                </Label>
                <Input
                  id="area_atuacao"
                  type="text"
                  value={formData.area_atuacao}
                  onChange={(e) => handleInputChange('area_atuacao', e.target.value)}
                  placeholder="Ex: Residencial, Comercial, Industrial..."
                />
              </div>

              {/* Botões */}
              <div className="flex gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/auth/profile-selection')}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Voltar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-construPro-blue hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Salvando...' : 'Completar Perfil'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfessionalProfileScreen;
