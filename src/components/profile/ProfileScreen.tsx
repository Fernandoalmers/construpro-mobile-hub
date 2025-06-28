import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useVendorProfile } from '@/hooks/useVendorProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import EnhancedAvatar from '@/components/common/EnhancedAvatar';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { User, MapPin, Phone, Mail, Star, Gift, ShoppingBag, Heart, Settings, FileText, CreditCard, Users, Package, MessageCircle, RefreshCw, Camera, Store } from 'lucide-react';
import { getSafeAvatarUrl } from '@/utils/avatarUtils';

const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const {
    profile,
    logout,
    refreshProfile,
    isLoading,
    updateProfile
  } = useAuth();
  const {
    vendorProfile
  } = useVendorProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  console.log("ProfileScreen: Rendering with state:", {
    hasProfile: !!profile,
    isLoading,
    profileId: profile?.id,
    userRole: profile?.tipo_perfil,
    hasVendorProfile: !!vendorProfile,
    vendorProfile: vendorProfile
  });

  const handleRefreshProfile = async () => {
    console.log("ProfileScreen: Refreshing profile...");
    await refreshProfile();
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile?.id) return;

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione um arquivo de imagem');
        return;
      }

      // Validate file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 2MB');
        return;
      }

      console.log('Uploading avatar for user:', profile.id);

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Erro ao fazer upload da imagem');
        return;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (!data?.publicUrl) {
        toast.error('Erro ao obter URL da imagem');
        return;
      }

      // Update profile with new avatar URL
      await updateProfile({ avatar: data.publicUrl });
      toast.success('Avatar atualizado com sucesso!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Erro ao atualizar avatar');
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-semibold">Carregando perfil...</h2>
        </div>
      </div>
    );
  }

  // Show error state if no profile after loading
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md">
          <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold mb-2">Erro ao carregar perfil</h2>
          <p className="text-gray-600 mb-6">
            Não foi possível carregar suas informações. Tente novamente.
          </p>
          <div className="space-y-3">
            <Button onClick={handleRefreshProfile} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
            <Button onClick={handleLogout} variant="outline" className="w-full">
              Sair da Conta
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Determine if user is a vendor and get appropriate display info
  const isVendor = profile.tipo_perfil === 'vendedor' || profile.tipo_perfil === 'lojista';
  const displayName = isVendor && vendorProfile?.nome_loja ? vendorProfile.nome_loja : profile.nome || 'Usuário';
  const displayEmail = isVendor && vendorProfile?.email ? vendorProfile.email : profile.email;
  const rawDisplayAvatar = isVendor && vendorProfile?.logo ? vendorProfile.logo : profile.avatar;
  const displayAvatar = getSafeAvatarUrl(rawDisplayAvatar);

  const menuItems = [
    {
      icon: User,
      title: 'Dados Pessoais',
      description: 'Gerencie suas informações pessoais',
      onClick: () => navigate('/profile/user-data'),
      color: 'text-blue-600'
    },
    {
      icon: MapPin,
      title: 'Endereços',
      description: 'Gerencie seus endereços de entrega',
      onClick: () => navigate('/profile/addresses'),
      color: 'text-green-600'
    },
    {
      icon: ShoppingBag,
      title: 'Meus Pedidos',
      description: 'Acompanhe seus pedidos online',
      onClick: () => navigate('/profile/orders'),
      color: 'text-orange-600'
    },
    {
      icon: Package,
      title: 'Compras Físicas',
      description: 'Histórico de compras nas lojas',
      onClick: () => navigate('/profile/physical-purchases'),
      color: 'text-purple-600'
    },
    {
      icon: Star,
      title: 'Histórico de Pontos',
      description: 'Acompanhe seus pontos acumulados',
      onClick: () => navigate('/profile/points-history'),
      color: 'text-yellow-600'
    },
    {
      icon: Users,
      title: 'Indicações',
      description: 'Convide amigos e ganhe pontos',
      onClick: () => navigate('/profile/referrals'),
      color: 'text-pink-600'
    },
    {
      icon: Heart,
      title: 'Favoritos',
      description: 'Produtos que você curtiu',
      onClick: () => navigate('/profile/favorites'),
      color: 'text-red-600'
    },
    {
      icon: FileText,
      title: 'Avaliações',
      description: 'Suas avaliações de produtos',
      onClick: () => navigate('/profile/reviews'),
      color: 'text-indigo-600'
    },
    {
      icon: Settings,
      title: 'Configurações',
      description: 'Preferências do aplicativo',
      onClick: () => navigate('/profile/settings'),
      color: 'text-gray-600'
    }
  ];

  // Add vendor-specific menu items
  if (isVendor) {
    menuItems.unshift({
      icon: Store,
      title: 'Painel do Vendedor',
      description: 'Gerencie sua loja e produtos',
      onClick: () => navigate('/vendor'),
      color: 'text-construPro-orange'
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header com informações do usuário */}
      <div className="bg-construPro-blue text-white">
        <div className="p-6 bg-construPro-blue">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <EnhancedAvatar
                src={displayAvatar}
                alt={displayName || 'Avatar'}
                fallback={displayName}
                size="xl"
                className="border-4 border-white cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleAvatarClick}
                showLoadingIndicator={true}
              />
              <div className="absolute -bottom-1 -right-1 bg-construPro-orange rounded-full p-1.5 cursor-pointer hover:bg-orange-600 transition-colors" onClick={handleAvatarClick}>
                <Camera className="w-3 h-3 text-white" />
              </div>
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{displayName}</h1>
              {displayEmail && <p className="text-construPro-blue-light opacity-90">{displayEmail}</p>}
              
              <div className="flex items-center space-x-4 mt-2">
                <Badge variant="secondary" className="bg-construPro-orange text-white">
                  {profile.tipo_perfil === 'consumidor' && 'Consumidor'}
                  {profile.tipo_perfil === 'profissional' && 'Profissional'}
                  {(profile.tipo_perfil === 'vendedor' || profile.tipo_perfil === 'lojista') && 'Vendedor'}
                </Badge>
                
                <div className="flex items-center space-x-1">
                  <Gift className="w-4 h-4" />
                  <span className="font-semibold">{profile.saldo_pontos || 0} pontos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Menu de opções */}
      <div className="p-4">
        <div className="grid gap-3">
          {menuItems.map((item, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer" onClick={item.onClick}>
              <CardContent className="flex items-center p-4">
                <div className={`w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mr-4 ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Ações do perfil */}
        <div className="mt-6 space-y-3">
          <Button onClick={handleLogout} variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50">
            Sair da conta
          </Button>
        </div>

        {/* Informações adicionais */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Matershop - Sua construção em boas mãos</p>
          <p className="mt-1">Versão 1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
