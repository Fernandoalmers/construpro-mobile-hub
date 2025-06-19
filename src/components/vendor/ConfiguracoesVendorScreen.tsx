
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Building2, User, MapPin, Package, Truck, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useVendorProfile } from '@/hooks/useVendorProfile';
import LoadingState from '@/components/common/LoadingState';

const ConfiguracoesVendorScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { vendorProfile, loading } = useVendorProfile();

  const configurationSections = [
    {
      title: 'Informações da Loja',
      description: 'Nome, logo, descrição e dados de contato',
      icon: Building2,
      action: () => navigate('/vendor/store-config'),
      color: 'bg-blue-50 text-blue-600'
    },
    {
      title: 'Perfil do Vendedor',
      description: 'Dados pessoais e informações de conta',
      icon: User,
      action: () => navigate('/vendor/profile'),
      color: 'bg-green-50 text-green-600'
    },
    {
      title: 'Zonas de Entrega',
      description: 'Configure as regiões onde você faz entregas',
      icon: MapPin,
      action: () => navigate('/vendor/delivery-zones'),
      color: 'bg-purple-50 text-purple-600'
    },
    {
      title: 'Restrições de Produtos',
      description: 'Defina produtos que não entregam em certas regiões',
      icon: Package,
      action: () => navigate('/vendor/product-restrictions'),
      color: 'bg-orange-50 text-orange-600'
    },
    {
      title: 'Configurações de Entrega',
      description: 'Métodos de entrega e taxas',
      icon: Truck,
      action: () => navigate('/vendor/delivery-settings'),
      color: 'bg-teal-50 text-teal-600'
    },
    {
      title: 'Configurações Gerais',
      description: 'Outras configurações da conta',
      icon: Settings,
      action: () => navigate('/vendor/general-settings'),
      color: 'bg-gray-50 text-gray-600'
    }
  ];

  if (loading) {
    return <LoadingState text="Carregando configurações..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/vendor')}
                className="flex items-center"
              >
                <ArrowLeft size={16} className="mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Configurações</h1>
                <p className="text-sm text-gray-500">Gerencie as configurações da sua loja</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Store Info */}
        <div className="mb-8">
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                {vendorProfile?.logo ? (
                  <img
                    src={vendorProfile.logo}
                    alt="Logo"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Building2 size={24} className="text-gray-400" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {vendorProfile?.nome_loja || 'Nome da Loja'}
                </h2>
                <p className="text-gray-500">
                  {vendorProfile?.email || user?.email || 'Email não informado'}
                </p>
                <p className="text-sm text-gray-400">
                  Status: <span className="capitalize">{vendorProfile?.status || 'pendente'}</span>
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Configuration Sections */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {configurationSections.map((section, index) => (
            <Card
              key={index}
              className="p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={section.action}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${section.color}`}>
                  <section.icon size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {section.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {section.description}
                  </p>
                  <Button variant="outline" size="sm">
                    Configurar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConfiguracoesVendorScreen;
