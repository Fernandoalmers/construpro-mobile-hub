
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SecurityFixButton } from '@/components/admin/SecurityFixButton';

const AdminSettingsScreen: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
        <p className="text-gray-600">Gerencie configurações administrativas e manutenção do sistema</p>
      </div>

      <div className="grid gap-6">
        {/* Configurações de Segurança */}
        <Card>
          <CardHeader>
            <CardTitle>Segurança do Sistema</CardTitle>
            <CardDescription>
              Monitore e corrija vulnerabilidades de segurança do banco de dados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SecurityFixButton />
          </CardContent>
        </Card>

        <Separator />

        {/* Outras configurações podem ser adicionadas aqui futuramente */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações Gerais</CardTitle>
            <CardDescription>
              Configurações gerais do sistema (em desenvolvimento)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Outras configurações administrativas serão adicionadas aqui conforme necessário.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettingsScreen;
