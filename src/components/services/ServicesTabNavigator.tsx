
import React, { useEffect, useState } from 'react';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Calendar, Check, Clock, ClipboardCheck, List, Star } from 'lucide-react';

// Import screens
import ServicesAvailableScreen from './ServicesAvailableScreen';
import MyProposalsScreen from './MyProposalsScreen';
import ContractedProjectsScreen from './ContractedProjectsScreen';
import CompletedServicesScreen from './CompletedServicesScreen';
import ServiceCalendarScreen from './ServiceCalendarScreen';
import CreateServiceRequestScreen from './CreateServiceRequestScreen';

// Mock data for quick stats - in real app, would be fetched from an API
const getQuickStats = (userId: string) => ({
  activeProposals: 3,
  ongoingProjects: 2,
  averageRating: 4.7,
  pointsEarned: 850
});

const ServicesTabNavigator: React.FC = () => {
  const { user } = useAuth();
  const isProfessional = user?.papel === 'profissional';
  const isConsumer = user?.papel === 'consumidor';
  
  const [activeTab, setActiveTab] = useState('available');
  const [stats, setStats] = useState({
    activeProposals: 0,
    ongoingProjects: 0,
    averageRating: 0,
    pointsEarned: 0
  });
  
  // Fetch stats on component mount - this is a mock implementation
  useEffect(() => {
    if (user) {
      const userStats = getQuickStats(user.id);
      setStats(userStats);
    }
  }, [user]);

  // Tabs configuration based on user role
  const tabs = [
    { id: 'available', label: 'Disponíveis', icon: <List size={18} /> },
    ...(isProfessional ? [{ id: 'proposals', label: 'Propostas', icon: <Clock size={18} /> }] : []),
    ...(isConsumer ? [{ id: 'create', label: 'Criar', icon: <ClipboardCheck size={18} /> }] : []),
    { id: 'contracted', label: 'Em Execução', icon: <Clock size={18} /> },
    { id: 'completed', label: 'Histórico', icon: <Check size={18} /> },
    ...(isProfessional ? [{ id: 'calendar', label: 'Agenda', icon: <Calendar size={18} /> }] : []),
  ];

  return (
    <div className="flex flex-col h-full pb-16">
      <div className="bg-white p-4 shadow-sm">
        <h1 className="text-xl font-bold text-construPro-blue mb-4">Serviços</h1>
        
        {isProfessional && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="bg-gray-50 p-3 rounded-md flex flex-col items-center">
              <span className="text-xs text-gray-500">Propostas</span>
              <span className="font-bold text-lg">{stats.activeProposals}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-md flex flex-col items-center">
              <span className="text-xs text-gray-500">Projetos</span>
              <span className="font-bold text-lg">{stats.ongoingProjects}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-md flex flex-col items-center">
              <div className="flex items-center">
                <span className="font-bold text-lg">{stats.averageRating}</span>
                <Star size={14} className="text-yellow-500 ml-1" fill="#EAB308" />
              </div>
              <span className="text-xs text-gray-500">Avaliação</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-md flex flex-col items-center">
              <span className="font-bold text-lg">{stats.pointsEarned}</span>
              <span className="text-xs text-gray-500">Pontos</span>
            </div>
          </div>
        )}
        
        <NavigationMenu className="max-w-full w-full justify-start">
          <NavigationMenuList className="flex w-full overflow-x-auto space-x-2 pb-1">
            {tabs.map((tab) => (
              <NavigationMenuItem key={tab.id} className="flex-shrink-0">
                <NavigationMenuLink
                  className={cn(
                    "px-3 py-2 flex items-center gap-1 text-sm rounded-md cursor-pointer transition-colors",
                    activeTab === tab.id
                      ? "bg-construPro-blue text-white"
                      : "hover:bg-gray-100"
                  )}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.id === 'proposals' && stats.activeProposals > 0 && (
                    <Badge variant="outline" className="bg-white text-construPro-blue ml-1 h-5 min-w-5 flex items-center justify-center p-0">
                      {stats.activeProposals}
                    </Badge>
                  )}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'available' && <ServicesAvailableScreen isProfessional={isProfessional} />}
        {activeTab === 'proposals' && isProfessional && <MyProposalsScreen />}
        {activeTab === 'create' && isConsumer && <CreateServiceRequestScreen />}
        {activeTab === 'contracted' && <ContractedProjectsScreen isProfessional={isProfessional} />}
        {activeTab === 'completed' && <CompletedServicesScreen isProfessional={isProfessional} />}
        {activeTab === 'calendar' && isProfessional && <ServiceCalendarScreen />}
      </div>
    </div>
  );
};

export default ServicesTabNavigator;
