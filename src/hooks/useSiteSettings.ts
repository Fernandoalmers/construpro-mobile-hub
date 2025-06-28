
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface SiteSettings {
  id: string;
  logo_url: string | null;
  logo_filename: string | null;
  favicon_url: string | null;
  favicon_filename: string | null;
  logo_variant_url: string | null;
  logo_variant_filename: string | null;
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
    return uploadFile(file, 'logo', 'logos');
  };

  const uploadFavicon = async (file: File): Promise<boolean> => {
    return uploadFile(file, 'favicon', 'favicons');
  };

  const uploadLogoVariant = async (file: File): Promise<boolean> => {
    return uploadFile(file, 'logo_variant', 'logo-variants');
  };

  const uploadFile = async (file: File, type: 'logo' | 'favicon' | 'logo_variant', folder: string): Promise<boolean> => {
    try {
      setIsUploading(true);
      
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Upload do arquivo para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        toast.error(`Erro ao fazer upload do ${type}`);
        return false;
      }

      // Obter URL pública do arquivo
      const { data: { publicUrl } } = supabase.storage
        .from('site-assets')
        .getPublicUrl(filePath);

      // Determinar quais campos atualizar
      const updateFields: any = {};
      const oldUrlField = `${type}_url`;
      const oldFilenameField = `${type}_filename`;
      
      updateFields[oldUrlField] = publicUrl;
      updateFields[oldFilenameField] = fileName;

      if (settings) {
        // Deletar arquivo anterior se existir
        const oldUrl = settings[oldUrlField as keyof SiteSettings] as string;
        if (oldUrl?.includes('site-assets')) {
          const oldPath = oldUrl.split('/site-assets/')[1];
          if (oldPath) {
            await supabase.storage
              .from('site-assets')
              .remove([oldPath]);
          }
        }

        // Atualizar configurações existentes
        const { error: updateError } = await supabase
          .from('site_settings')
          .update(updateFields)
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
          .insert(updateFields);

        if (insertError) {
          console.error('Error inserting settings:', insertError);
          toast.error('Erro ao salvar configurações');
          return false;
        }
      }

      const typeNames = {
        logo: 'Logo',
        favicon: 'Favicon',
        logo_variant: 'Logo variante'
      };

      toast.success(`${typeNames[type]} atualizada com sucesso!`);
      await fetchSettings(); // Recarregar configurações
      
      // Se for favicon, atualizar dinamicamente
      if (type === 'favicon') {
        updateFavicon(publicUrl);
      }
      
      return true;

    } catch (error) {
      console.error(`Error in upload${type}:`, error);
      toast.error('Erro inesperado ao fazer upload');
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const updateFavicon = (faviconUrl: string) => {
    // Remover favicon existente
    const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
    existingFavicons.forEach(favicon => favicon.remove());

    // Criar novo favicon
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/png';
    favicon.href = faviconUrl;

    // Adicionar ao head
    document.head.appendChild(favicon);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    isLoading,
    isUploading,
    uploadLogo,
    uploadFavicon,
    uploadLogoVariant,
    refetch: fetchSettings
  };
};
