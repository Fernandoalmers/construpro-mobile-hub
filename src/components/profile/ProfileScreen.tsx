
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../common/Avatar';
import Card from '../common/Card';
import ProgressBar from '../common/ProgressBar';
import CustomButton from '../common/CustomButton';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Award, 
  User, 
  Lock, 
  Settings, 
  Bell, 
  LogOut, 
  ChevronRight, 
  ShoppingBag, 
  CircleDollarSign, 
  Receipt, 
  Bookmark, 
  Users, 
  MessageSquare,
  Store,
  Wrench,
  RefreshCw,
  MapPin,
  Camera,
  Loader2
} from 'lucide-react';
import { useAuth, UserRole } from '../../context/AuthContext';
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import ChangePasswordModal from './ChangePasswordModal';

const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser, profile, logout, updateUser, updateProfile, refreshProfile } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  
  // Use profile data if available, with improved fallbacks
  const userPapel = profile?.papel || profile?.tipo_perfil || 'consumidor';
  
  const [vendorMode, setVendorMode] = useState(userPapel === 'lojista');
  const [professionalMode, setProfessionalMode] = useState(userPapel === 'profissional');
  const [showModeSwitch, setShowModeSwitch] = useState(false);
  
  // Synchronize mode states with profile changes
  useEffect(() => {
    if (profile) {
      const isVendor = profile.papel === 'lojista' || profile.tipo_perfil === 'lojista';
      const isProfessional = profile.papel === 'profissional' || profile.tipo_perfil === 'profissional';
      setVendorMode(isVendor);
      setProfessionalMode(isProfessional);
    }
  }, [profile]);

  // Calculate level info
  const levelPoints = {
    bronze: { min: 0, max: 2000 },
    silver: { min: 2000, max: 5000 },
    gold: { min: 5000, max: 5000 }, // Max is same as min for gold since it's the highest
  };

  let currentLevel = 'bronze';
  let nextLevel = 'silver';
  let currentProgress = 0;
  let maxProgress = 2000;
  
  // Get saldo_pontos from profile
  const userPoints = profile ? profile.saldo_pontos || 0 : 0;
  
  if (userPoints >= levelPoints.gold.min) {
    currentLevel = 'gold';
    nextLevel = '';
    currentProgress = 5000;
    maxProgress = 5000;
  } else if (userPoints >= levelPoints.silver.min) {
    currentLevel = 'silver';
    nextLevel = 'gold';
    currentProgress = userPoints - levelPoints.silver.min;
    maxProgress = levelPoints.gold.min - levelPoints.silver.min;
  } else {
    currentProgress = userPoints;
    maxProgress = levelPoints.silver.min;
  }
  
  const levelMap = {
    bronze: { color: '#CD7F32', name: 'Bronze' },
    silver: { color: '#C0C0C0', name: 'Prata' },
    gold: { color: '#FFD700', name: 'Ouro' },
  };

  const toggleVendorMode = async () => {
    try {
      if (!vendorMode) {
        // Switching to vendor mode
        console.log("Attempting to switch to vendor mode");
        
        // Update both user metadata and profile
        const updateResult = await updateUser({ papel: 'lojista', tipo_perfil: 'lojista' });
        console.log("Update result:", updateResult);
        
        // Update local state
        setProfessionalMode(false);
        setVendorMode(true);
        
        toast.success("Modo Vendedor ativado!");
        
        // Navigate to vendor page immediately
        navigate('/vendor');
      } else {
        // Switching back to consumer mode
        console.log("Switching back to consumer mode");
        
        await updateUser({ papel: 'consumidor', tipo_perfil: 'consumidor' });
        setVendorMode(false);
        
        toast.success("Modo Consumidor ativado!");
        navigate('/home');
      }
    } catch (error) {
      console.error("Error toggling vendor mode:", error);
      toast.error("Erro ao alterar modo. Tente novamente.");
    }
  };

  const toggleProfessionalMode = async () => {
    try {
      if (!professionalMode) {
        // Switching to professional mode
        await updateUser({ papel: 'profissional', tipo_perfil: 'profissional' });
        setVendorMode(false);
        setProfessionalMode(true);
        
        toast.success("Modo Profissional ativado!");
        
        // Navigate immediately instead of using setTimeout
        navigate('/services');
      } else {
        // Switching back to consumer mode
        await updateUser({ papel: 'consumidor', tipo_perfil: 'consumidor' });
        setProfessionalMode(false);
        
        toast.success("Modo Consumidor ativado!");
        navigate('/home');
      }
    } catch (error) {
      console.error("Error toggling professional mode:", error);
      toast.error("Erro ao alterar modo. Tente novamente.");
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Function to handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${authUser?.id}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${fileName}`;
      
      setUploading(true);
      
      // Upload the file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        console.error("Upload error:", error);
        throw error;
      }
      
      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      console.log("Avatar URL:", publicUrl);
      
      // Update the user's profile with the new avatar URL
      const updateResult = await updateProfile({ avatar: publicUrl });
      
      if (!updateResult) {
        throw new Error("Failed to update profile with new avatar");
      }
      
      // Refresh the profile to get the updated avatar
      await refreshProfile();
      
      toast.success("Avatar atualizado com sucesso!");
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast.error("Erro ao atualizar avatar. Tente novamente.");
    } finally {
      setUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleOpenChangePasswordModal = () => {
    setIsChangePasswordModalOpen(true);
  };

  // Get user display name and email safely
  const userName = profile?.nome || authUser?.user_metadata?.nome || "Usuário";
  const userEmail = profile?.email || authUser?.email || "";
  const userAvatar = profile?.avatar || undefined;
  const userCode = profile?.codigo || "";

  // Profile menu sections
  const profileSections = [
    {
      title: "Pedidos Realizados",
      icon: <ShoppingBag className="text-construPro-blue mr-3" size={20} />,
      path: "/profile/orders"
    },
    {
      title: "Pontos e Extrato",
      icon: <CircleDollarSign className="text-construPro-blue mr-3" size={20} />,
      path: "/profile/points-history"
    },
    {
      title: "Compras Físicas",
      icon: <Receipt className="text-construPro-blue mr-3" size={20} />,
      path: "/profile/physical-purchases"
    },
    {
      title: "Favoritos",
      icon: <Bookmark className="text-construPro-blue mr-3" size={20} />,
      path: "/profile/favorites"
    },
    {
      title: "Indique e Ganhe",
      icon: <Users className="text-construPro-blue mr-3" size={20} />,
      path: "/profile/referrals"
    },
    {
      title: "Avaliações Feitas",
      icon: <MessageSquare className="text-construPro-blue mr-3" size={20} />,
      path: "/profile/reviews"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Hidden file input for avatar upload */}
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarUpload}
        accept="image/*"
        className="hidden"
      />
      
      {/* Header */}
      <div className="bg-construPro-blue p-6 pt-12 rounded-b-3xl">
        <div className="flex flex-col items-center mb-4">
          <div className="relative">
            <Avatar 
              src={userAvatar} 
              alt={userName}
              fallback={userName}
              size="xl" 
              className="border-4 border-white mb-3"
            />
            <button 
              className="absolute bottom-2 right-0 bg-white p-1 rounded-full shadow-md"
              onClick={handleAvatarClick}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 size={16} className="text-construPro-blue animate-spin" />
              ) : (
                <Camera size={16} className="text-construPro-blue" />
              )}
            </button>
          </div>
          <h1 className="text-xl font-bold text-white">{userName}</h1>
          <p className="text-white text-opacity-70">{userEmail}</p>
          {userCode && (
            <div className="mt-2 bg-white px-4 py-1 rounded-full text-sm">
              <span className="font-medium text-construPro-blue">Código: </span>
              <span>{userCode}</span>
            </div>
          )}
          
          <Button
            variant="outline"
            size="sm"
            className="mt-3 bg-white text-construPro-blue border-white"
            onClick={() => setShowModeSwitch(!showModeSwitch)}
          >
            <RefreshCw size={16} className="mr-2" />
            {showModeSwitch ? 'Ocultar modos' : 'Alternar modo'}
          </Button>
        </div>
      </div>
      
      {/* Mode switcher */}
      {showModeSwitch && (
        <div className="px-6 -mt-4 mb-2">
          <Card className="p-4 bg-white">
            <h3 className="font-medium mb-3">Alternar entre modos</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <User className="text-construPro-blue mr-3" size={20} />
                  <span>Modo Consumidor</span>
                </div>
                <Switch
                  checked={!vendorMode && !professionalMode}
                  onCheckedChange={() => {
                    if (vendorMode || professionalMode) {
                      updateUser({ papel: 'consumidor', tipo_perfil: 'consumidor' })
                        .then(() => {
                          setVendorMode(false);
                          setProfessionalMode(false);
                          toast.success("Modo Consumidor ativado!");
                          navigate('/home');
                        })
                        .catch(error => {
                          console.error("Error switching to consumer mode:", error);
                          toast.error("Erro ao alternar para modo consumidor");
                        });
                    }
                  }}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Wrench className="text-construPro-blue mr-3" size={20} />
                  <span>Modo Profissional</span>
                </div>
                <Switch
                  checked={professionalMode}
                  onCheckedChange={toggleProfessionalMode}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Store className="text-construPro-blue mr-3" size={20} />
                  <span>Modo Vendedor</span>
                </div>
                <Switch
                  checked={vendorMode}
                  onCheckedChange={toggleVendorMode}
                />
              </div>
            </div>
          </Card>
        </div>
      )}
      
      {/* Level Card */}
      <div className="px-6 -mt-6">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Award size={18} className="text-construPro-orange mr-2" />
              <h3 className="font-medium">Nível</h3>
            </div>
            <span 
              className="font-bold"
              style={{ color: levelMap[currentLevel as keyof typeof levelMap].color }}
            >
              {levelMap[currentLevel as keyof typeof levelMap].name}
            </span>
          </div>
          <ProgressBar 
            value={currentProgress} 
            max={maxProgress} 
            showLabel={true}
            size="md"
            color="orange"
          />
          <p className="text-xs text-gray-500 mt-1 text-center">
            {nextLevel 
              ? `Faltam ${maxProgress - currentProgress} pontos para o nível ${levelMap[nextLevel as keyof typeof levelMap].name}` 
              : 'Nível máximo atingido!'}
          </p>
        </Card>
      </div>

      {/* Profile Sections */}
      <div className="p-6 space-y-4">
        <Card className="overflow-hidden">
          <div className="divide-y divide-gray-100">
            {profileSections.map((section, index) => (
              <div 
                key={index} 
                className="p-4 flex items-center justify-between cursor-pointer"
                onClick={() => navigate(section.path)}
              >
                <div className="flex items-center">
                  {section.icon}
                  <span>{section.title}</span>
                </div>
                <ChevronRight className="text-gray-400" size={18} />
              </div>
            ))}
          </div>
        </Card>
        
        <Card className="overflow-hidden">
          <div className="divide-y divide-gray-100">
            <div 
              className="p-4 flex items-center justify-between cursor-pointer"
              onClick={() => navigate('/profile/user-data')}
            >
              <div className="flex items-center">
                <User className="text-construPro-blue mr-3" size={20} />
                <span>Dados pessoais</span>
              </div>
              <ChevronRight className="text-gray-400" size={18} />
            </div>
            
            <div 
              className="p-4 flex items-center justify-between cursor-pointer"
              onClick={() => navigate('/profile/addresses')}
            >
              <div className="flex items-center">
                <MapPin className="text-construPro-blue mr-3" size={20} />
                <span>Meus endereços</span>
              </div>
              <ChevronRight className="text-gray-400" size={18} />
            </div>
            
            <div 
              className="p-4 flex items-center justify-between cursor-pointer"
              onClick={handleOpenChangePasswordModal}
            >
              <div className="flex items-center">
                <Lock className="text-construPro-blue mr-3" size={20} />
                <span>Alterar senha</span>
              </div>
              <ChevronRight className="text-gray-400" size={18} />
            </div>
            
            <div 
              className="p-4 flex items-center justify-between cursor-pointer"
              onClick={() => navigate('/profile/settings')}
            >
              <div className="flex items-center">
                <Settings className="text-construPro-blue mr-3" size={20} />
                <span>Configurações</span>
              </div>
              <ChevronRight className="text-gray-400" size={18} />
            </div>
            
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <Bell className="text-construPro-blue mr-3" size={20} />
                <span>Notificações</span>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
          </div>
        </Card>
        
        <CustomButton 
          variant="outline" 
          fullWidth
          onClick={handleLogout}
          className="text-red-600 border-red-200"
          icon={<LogOut size={18} />}
        >
          Sair
        </CustomButton>
      </div>
      
      {/* Change Password Modal */}
      <ChangePasswordModal 
        open={isChangePasswordModalOpen}
        onOpenChange={setIsChangePasswordModalOpen}
      />
    </div>
  );
};

export default ProfileScreen;
