
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, MapPin, Phone, Mail, Briefcase, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

const ProfessionalProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    especialidade: '',
    cidade: '',
    estado: '',
    sobre: '',
    area_atuacao: ''
  });

  const especialidades = [
    'Pedreiro',
    'Eletricista',
    'Encanador',
    'Pintor',
    'Carpinteiro',
    'Soldador',
    'Telhadista',
    'Azulejista',
    'Gesseiro',
    'Vidraceiro',
    'Jardineiro',
    'Outro'
  ];

  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
    'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
    'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.telefone || !formData.especialidade || !formData.cidade || !formData.estado) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setIsLoading(true);
    
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Usuário não autenticado');
      }

      // Criar perfil profissional
      const { error: profileError } = await supabase
        .from('professionals')
        .insert({
          profile_id: user.user.id,
          nome: formData.nome,
          telefone: formData.telefone,
          especialidade: formData.especialidade,
          especialidades: [formData.especialidade],
          cidade: formData.cidade,
          estado: formData.estado,
          sobre: formData.sobre || 'Profissional qualificado e experiente.',
          area_atuacao: formData.area_atuacao || formData.cidade
        });

      if (profileError) {
        throw profileError;
      }

      // Atualizar o perfil do usuário para tipo profissional
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          tipo_perfil: 'profissional',
          papel: 'profissional'
        })
        .eq('id', user.user.id);

      if (updateError) {
        throw updateError;
      }

      toast.success('Perfil profissional criado com sucesso!');
      navigate('/services');
    } catch (error: any) {
      console.error('Erro ao criar perfil profissional:', error);
      toast.error('Erro ao criar perfil profissional: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="mr-4"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Perfil Profissional</h1>
            <p className="text-gray-600">Complete seu perfil para oferecer serviços</p>
          </div>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Pessoais */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="text-construPro-blue" size={20} />
                <h3 className="text-lg font-semibold">Informações Pessoais</h3>
              </div>
              
              <div>
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              <div>
                <Label htmlFor="telefone">Telefone/WhatsApp *</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange('telefone', e.target.value)}
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>
            </div>

            {/* Especialidade */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="text-construPro-blue" size={20} />
                <h3 className="text-lg font-semibold">Especialidade</h3>
              </div>
              
              <div>
                <Label htmlFor="especialidade">Especialidade Principal *</Label>
                <Select 
                  value={formData.especialidade} 
                  onValueChange={(value) => handleInputChange('especialidade', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione sua especialidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {especialidades.map((esp) => (
                      <SelectItem key={esp} value={esp}>{esp}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Localização */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="text-construPro-blue" size={20} />
                <h3 className="text-lg font-semibold">Localização</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cidade">Cidade *</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => handleInputChange('cidade', e.target.value)}
                    placeholder="Sua cidade"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="estado">Estado *</Label>
                  <Select 
                    value={formData.estado} 
                    onValueChange={(value) => handleInputChange('estado', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {estados.map((estado) => (
                        <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="area_atuacao">Área de Atuação</Label>
                <Input
                  id="area_atuacao"
                  value={formData.area_atuacao}
                  onChange={(e) => handleInputChange('area_atuacao', e.target.value)}
                  placeholder="Região onde atende (ex: Centro, Zona Sul)"
                />
              </div>
            </div>

            {/* Sobre */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="text-construPro-blue" size={20} />
                <h3 className="text-lg font-semibold">Sobre Você</h3>
              </div>
              
              <div>
                <Label htmlFor="sobre">Descrição Profissional</Label>
                <Textarea
                  id="sobre"
                  value={formData.sobre}
                  onChange={(e) => handleInputChange('sobre', e.target.value)}
                  placeholder="Conte um pouco sobre sua experiência e serviços..."
                  rows={4}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Descreva sua experiência, especialidades e diferenciais
                </p>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(-1)}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="flex-1 bg-construPro-blue hover:bg-construPro-blue/90"
              >
                {isLoading ? 'Salvando...' : 'Criar Perfil'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ProfessionalProfileScreen;
