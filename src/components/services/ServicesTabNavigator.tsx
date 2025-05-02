
import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import MyServicesScreen from './MyServicesScreen';
import AvailableServicesScreen from './AvailableServicesScreen';
import MyProposalsScreen from './MyProposalsScreen';
import ContractedProjectsScreen from './ContractedProjectsScreen';
import CompletedServicesScreen from './CompletedServicesScreen';
import ServiceCalendarScreen from './ServiceCalendarScreen';
import { useAuth } from '@/context/AuthContext';

const ServicesTabNavigator: React.FC = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('available');

  // Default to consumer if no profile or papel is undefined
  const isProfessional = profile?.papel === 'profissional' || profile?.tipo_perfil === 'profissional';
  const showProfessionalTabs = isProfessional;

  useEffect(() => {
    // If the user is not a professional, default to the "available" tab
    if (!showProfessionalTabs) {
      setActiveTab('available');
    }
  }, [showProfessionalTabs]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="available">Serviços Disponíveis</TabsTrigger>
        {showProfessionalTabs && (
          <>
            <TabsTrigger value="my-services">Meus Serviços</TabsTrigger>
            <TabsTrigger value="my-proposals">Minhas Propostas</TabsTrigger>
            <TabsTrigger value="contracted">Contratados</TabsTrigger>
            <TabsTrigger value="completed">Concluídos</TabsTrigger>
            <TabsTrigger value="calendar">Calendário</TabsTrigger>
          </>
        )}
      </TabsList>

      <TabsContent value="available">
        <AvailableServicesScreen isProfessional={isProfessional} />
      </TabsContent>
      {showProfessionalTabs && (
        <>
          <TabsContent value="my-services">
            <MyServicesScreen isProfessional={isProfessional} />
          </TabsContent>
          <TabsContent value="my-proposals">
            <MyProposalsScreen />
          </TabsContent>
          <TabsContent value="contracted">
            <ContractedProjectsScreen isProfessional={isProfessional} />
          </TabsContent>
          <TabsContent value="completed">
            <CompletedServicesScreen isProfessional={isProfessional} />
          </TabsContent>
          <TabsContent value="calendar">
            <ServiceCalendarScreen />
          </TabsContent>
        </>
      )}
    </Tabs>
  );
};

export default ServicesTabNavigator;
