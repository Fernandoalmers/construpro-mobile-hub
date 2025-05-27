
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Settings, ChevronLeft, LogOut, AlertTriangle, Smartphone, Bell, Eye, Shield, HelpCircle } from 'lucide-react';
import { toast } from "@/components/ui/sonner";
import { Switch } from "@/components/ui/switch";

const SettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = () => {
    logout();
    toast.info("Sessão encerrada");
    navigate('/login');
  };
  
  const handleDeleteAccount = () => {
    if (confirm('Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.')) {
      toast.error("Funcionalidade não implementada");
    }
  };

  const toggleNotifications = () => {
    setNotifications(!notifications);
    toast.info(notifications ? "Notificações desativadas" : "Notificações ativadas");
  };

  const toggleMarketing = () => {
    setMarketing(!marketing);
    toast.info(marketing ? "E-mails de marketing desativados" : "E-mails de marketing ativados");
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    toast.info(darkMode ? "Modo claro ativado" : "Modo escuro ativado");
  };

  return (
    <div className="bg-white min-h-screen pb-16">
      <div className="bg-construPro-blue px-4 py-6 flex items-center text-white shadow-md">
        <button 
          onClick={() => navigate(-1)}
          className="p-1 rounded-full hover:bg-blue-700 mr-3"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-semibold">Configurações</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <div>
          <h3 className="text-gray-500 uppercase text-xs font-semibold mb-2 px-1">Notificações</h3>
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center">
                <Bell size={20} className="text-construPro-blue mr-3" />
                <div>
                  <p className="font-medium">Notificações push</p>
                  <p className="text-sm text-gray-500">Receber notificações em seu dispositivo</p>
                </div>
              </div>
              <Switch checked={notifications} onCheckedChange={toggleNotifications} />
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <Smartphone size={20} className="text-construPro-blue mr-3" />
                <div>
                  <p className="font-medium">E-mails de marketing</p>
                  <p className="text-sm text-gray-500">Receba ofertas e novidades</p>
                </div>
              </div>
              <Switch checked={marketing} onCheckedChange={toggleMarketing} />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-gray-500 uppercase text-xs font-semibold mb-2 px-1">Aparência</h3>
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <Eye size={20} className="text-construPro-blue mr-3" />
                <div>
                  <p className="font-medium">Modo escuro</p>
                  <p className="text-sm text-gray-500">Ativar tema escuro</p>
                </div>
              </div>
              <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-gray-500 uppercase text-xs font-semibold mb-2 px-1">Conta</h3>
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b flex items-center">
              <HelpCircle size={20} className="text-construPro-blue mr-3" />
              <div>
                <p className="font-medium">Ajuda e suporte</p>
                <p className="text-sm text-gray-500">Entre em contato conosco</p>
              </div>
            </div>
            <div 
              className="p-4 border-b flex items-center cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut size={20} className="text-amber-600 mr-3" />
              <div>
                <p className="font-medium">Sair</p>
                <p className="text-sm text-gray-500">Encerrar sessão</p>
              </div>
            </div>
            <div 
              className="p-4 flex items-center cursor-pointer"
              onClick={handleDeleteAccount}
            >
              <AlertTriangle size={20} className="text-red-600 mr-3" />
              <div>
                <p className="font-medium text-red-600">Excluir conta</p>
                <p className="text-sm text-gray-500">Apagar todos os dados</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
