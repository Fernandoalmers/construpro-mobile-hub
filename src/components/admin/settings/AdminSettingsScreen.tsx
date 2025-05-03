
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useTitle } from '@/hooks/use-title';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Settings, Shield, Bell, Database } from 'lucide-react';

const AdminSettingsScreen: React.FC = () => {
  useTitle('ConstruPro Admin - Configurações');
  
  return (
    <AdminLayout currentSection="configurações">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Configurações do Sistema</h2>
        
        <Tabs defaultValue="general">
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="backup">Backup</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  Configurações Gerais
                </CardTitle>
                <CardDescription>
                  Configure os parâmetros gerais do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nome da Plataforma</label>
                      <input 
                        type="text" 
                        className="w-full p-2 border rounded" 
                        defaultValue="ConstruPro" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">E-mail de Contato</label>
                      <input 
                        type="email" 
                        className="w-full p-2 border rounded" 
                        defaultValue="contato@construpro.com" 
                      />
                    </div>
                  </div>
                  
                  <Button>Salvar Alterações</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Segurança
                </CardTitle>
                <CardDescription>
                  Configure as políticas de segurança da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Configurações de segurança em breve.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="mr-2 h-5 w-5" />
                  Notificações
                </CardTitle>
                <CardDescription>
                  Configure os templates e políticas de notificação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Configurações de notificações em breve.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="backup" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="mr-2 h-5 w-5" />
                  Backup
                </CardTitle>
                <CardDescription>
                  Configure políticas de backup e restauração
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Configurações de backup em breve.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSettingsScreen;
