
import { useEffect } from 'react';
import { ensureVendorProfileRole } from '@/services/vendorProfileService';
import { toast } from '@/components/ui/sonner';

export const useVendorVerification = () => {
  // Check vendor role on component mount
  useEffect(() => {
    const verifyVendorRole = async () => {
      try {
        await ensureVendorProfileRole();
      } catch (error) {
        console.error('Error verifying vendor role:', error);
        toast.error('Erro ao verificar perfil de vendedor');
      }
    };
    
    verifyVendorRole();
  }, []);
};
