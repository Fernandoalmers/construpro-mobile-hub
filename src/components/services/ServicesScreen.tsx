
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Settings, Calendar, MapPin, Star, Phone } from 'lucide-react';
import { toast } from "@/components/ui/sonner";

const ServicesScreen: React.FC = () => {
  const navigate = useNavigate();
  const { profile, isLoading } = useAuth();
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceData, setServiceData] = useState({
    titulo: '',
    descricao: '',
    preco: '',
    categoria: '',
    disponibilidade: ''
  });

  useEffect(() => {
    // Verificar se o usuário é profissional
    if (!isLoading && profile && profile.tipo_perfil !== 'profissional') {
      toast.error('Acesso negado: Esta área é exclusiva para profissionais');
      navigate('/home');
    }
  }, [profile, isLoading, navigate]);

  const handleServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui seria implementada a lógica para salvar o serviço
    toast.success('Serviço cadastrado com sucesso!');
    setShowServiceForm(false);
    setServiceData({
      titulo: '',
      descricao: '',
      preco: '',
      categoria: '',
      disponibilidade: ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setServiceData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-construPro-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-construPro-blue px-4 py-6 flex items-center text-white shadow-md">
        <button 
          onClick={() => navigate('/home')}
          className="p-1 rounded-full hover:bg-blue-700 mr-3"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Serviços Profissionais</h1>
          <p className="text-blue-100 text-sm">
            Especialidade: {profile?.especialidade_profissional || 'Não informada'}
          </p>
        </div>
        <button 
          onClick={() => navigate('/profile/settings')}
          className="p-2 rounded-full hover:bg-blue-700"
        >
          <Settings size={20} />
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">4.8</p>
              <p className="text-sm text-gray-600">Avaliação</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-8 w-8 text-construPro-blue mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">12</p>
              <p className="text-sm text-gray-600">Serviços</p>
            </CardContent>
          </Card>
        </div>

        {/* Seção de serviços */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Meus Serviços</CardTitle>
            <Button 
              onClick={() => setShowServiceForm(!showServiceForm)}
              size="sm"
              className="bg-construPro-orange hover:bg-orange-600"
            >
              <Plus size={16} className="mr-1" />
              Novo Serviço
            </Button>
          </CardHeader>
          <CardContent>
            {showServiceForm ? (
              <form onSubmit={handleServiceSubmit} className="space-y-4 border-t pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título do Serviço
                  </label>
                  <Input
                    name="titulo"
                    value={serviceData.titulo}
                    onChange={handleInputChange}
                    placeholder="Ex: Instalação elétrica residencial"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <Textarea
                    name="descricao"
                    value={serviceData.descricao}
                    onChange={handleInputChange}
                    placeholder="Descreva o serviço oferecido..."
                    rows={3}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço (R$)
                    </label>
                    <Input
                      name="preco"
                      type="number"
                      value={serviceData.preco}
                      onChange={handleInputChange}
                      placeholder="150.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoria
                    </label>
                    <Input
                      name="categoria"
                      value={serviceData.categoria}
                      onChange={handleInputChange}
                      placeholder="Ex: Elétrica, Hidráulica"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Disponibilidade
                  </label>
                  <Input
                    name="disponibilidade"
                    value={serviceData.disponibilidade}
                    onChange={handleInputChange}
                    placeholder="Ex: Segunda a Sexta, 8h às 17h"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="bg-construPro-orange hover:bg-orange-600">
                    Salvar Serviço
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowServiceForm(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum serviço cadastrado ainda</p>
                <p className="text-sm">Clique em "Novo Serviço" para começar</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Solicitações recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Solicitações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma solicitação no momento</p>
              <p className="text-sm">As solicitações de clientes aparecerão aqui</p>
            </div>
          </CardContent>
        </Card>

        {/* Links rápidos */}
        <div className="grid grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            className="h-20 flex flex-col items-center justify-center"
            onClick={() => navigate('/profile')}
          >
            <Settings className="h-6 w-6 mb-2" />
            <span className="text-sm">Perfil</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex flex-col items-center justify-center"
            onClick={() => navigate('/marketplace')}
          >
            <MapPin className="h-6 w-6 mb-2" />
            <span className="text-sm">Marketplace</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServicesScreen;
