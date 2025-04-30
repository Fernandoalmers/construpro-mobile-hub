
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import AvailableServicesScreen from './AvailableServicesScreen';
import CreateServiceRequestScreen from './CreateServiceRequestScreen';
import MyServicesScreen from './MyServicesScreen';
import { useAuth } from '@/context/AuthContext';

const ServicesTabNavigator: React.FC = () => {
  const { user } = useAuth();
  const isProfessional = user?.papel === 'profissional';
  const isVendor = user?.papel === 'vendedor';

  return (
    <div className="flex flex-col h-full pb-16">
      <div className="bg-white p-4 shadow-sm">
        <h1 className="text-xl font-bold text-construPro-blue">Serviços</h1>
      </div>
      
      <Tabs defaultValue="available" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="available">Disponíveis</TabsTrigger>
          <TabsTrigger value="create">Criar</TabsTrigger>
          <TabsTrigger value="mine">Meus Serviços</TabsTrigger>
        </TabsList>
        
        <TabsContent value="available" className="flex-1 overflow-auto p-4">
          <AvailableServicesScreen isProfessional={isProfessional} />
        </TabsContent>
        
        <TabsContent value="create" className="flex-1 overflow-auto p-4">
          <CreateServiceRequestScreen />
        </TabsContent>
        
        <TabsContent value="mine" className="flex-1 overflow-auto p-4">
          <MyServicesScreen isProfessional={isProfessional} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServicesTabNavigator;
