
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/sonner';
import { 
  getVendorProfile, 
  saveVendorProfile, 
  uploadVendorLogo,
  uploadVendorBanner,
  VendorProfile
} from '@/services/vendorProfileService';

interface UpdateVendorProfileParams {
  nome_loja: string;
  descricao: string;
  telefone: string;
  whatsapp: string;
  email: string;
  segmento: string;
  logoFile?: File | null;
  bannerFile?: File | null;
}

export const useVendorProfile = () => {
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch vendor profile on hook initialization
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const profile = await getVendorProfile();
        setVendorProfile(profile);
        setError(null);
      } catch (err) {
        console.error('Error fetching vendor profile:', err);
        setError('Não foi possível carregar o perfil do vendedor.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Function to update vendor profile
  const updateVendorProfile = async (updatedData: UpdateVendorProfileParams): Promise<VendorProfile | null> => {
    try {
      let logoUrl = vendorProfile?.logo;
      let bannerUrl = vendorProfile?.banner;
      
      // Upload logo if provided
      if (updatedData.logoFile) {
        const uploadedLogoUrl = await uploadVendorLogo(updatedData.logoFile);
        if (uploadedLogoUrl) {
          logoUrl = uploadedLogoUrl;
        }
      }
      
      // Upload banner if provided
      if (updatedData.bannerFile) {
        const uploadedBannerUrl = await uploadVendorBanner(updatedData.bannerFile);
        if (uploadedBannerUrl) {
          bannerUrl = uploadedBannerUrl;
        }
      }
      
      // Create update object without file properties
      const { logoFile, bannerFile, ...profileData } = updatedData;
      
      // Update profile with new data and image URLs
      const updatedProfile = await saveVendorProfile({
        ...profileData,
        logo: logoUrl,
        banner: bannerUrl
      });
      
      if (updatedProfile) {
        setVendorProfile(updatedProfile);
        return updatedProfile;
      } else {
        throw new Error('Failed to update vendor profile');
      }
    } catch (err) {
      console.error('Error updating vendor profile:', err);
      throw err;
    }
  };

  return {
    vendorProfile,
    isLoading,
    error,
    updateVendorProfile
  };
};
