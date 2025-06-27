
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface SiteSettings {
  id: string;
  logo_url: string | null;
  logo_filename: string | null;
  updated_at: string;
  created_at: string;
}

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching site settings:', error);
        return;
      }

      setSettings(data);
    } catch (error) {
      console.error('Error fetching site settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadLogo = async (file: File): Promise<boolean> => {
    try {
      setIsUploading(true);
      
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Upload do arquivo para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        toast.error('Erro ao fazer upload da logo');
        return false;
      }

      // Obter URL pública do arquivo
      const { data: { publicUrl } } = supabase.storage
        .from('site-assets')
        .getPublicUrl(filePath);

      // Atualizar ou inserir configurações no banco
      if (settings) {
        // Deletar logo anterior se existir
        if (settings.logo_url?.includes('site-assets')) {
          const oldPath = settings.logo_url.split('/site-assets/')[1];
          if (oldPath) {
            await supabase.storage
              .from('site-assets')
              .remove([oldPath]);
          }
        }

        // Atualizar configurações existentes
        const { error: updateError } = await supabase
          .from('site_settings')
          .update({
            logo_url: publicUrl,
            logo_filename: fileName
          })
          .eq('id', settings.id);

        if (updateError) {
          console.error('Error updating settings:', updateError);
          toast.error('Erro ao atualizar configurações');
          return false;
        }
      } else {
        // Inserir novas configurações
        const { error: insertError } = await supabase
          .from('site_settings')
          .insert({
            logo_url: publicUrl,
            logo_filename: fileName
          });

        if (insertError) {
          console.error('Error inserting settings:', insertError);
          toast.error('Erro ao salvar configurações');
          return false;
        }
      }

      toast.success('Logo atualizada com sucesso!');
      await fetchSettings(); // Recarregar configurações
      return true;

    } catch (error) {
      console.error('Error in uploadLogo:', error);
      toast.error('Erro inesperado ao fazer upload');
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    isLoading,
    isUploading,
    uploadLogo,
    refetch: fetchSettings
  };
};
