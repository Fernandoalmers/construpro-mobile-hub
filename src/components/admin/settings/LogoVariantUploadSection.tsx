
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Image, AlertCircle } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import LoadingState from '@/components/common/LoadingState';

const LogoVariantUploadSection: React.FC = () => {
  const { settings, isUploading, uploadLogoVariant } = useSiteSettings();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem (PNG, JPG, SVG)');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('O arquivo deve ter no máximo 5MB');
      return;
    }

    setSelectedFile(file);

    // Criar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const success = await uploadLogoVariant(selectedFile);
    if (success) {
      setSelectedFile(null);
      setPreviewUrl(null);
      
      // Limpar input
      const fileInput = document.getElementById('logo-variant-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  const getCurrentLogoVariantUrl = () => {
    return settings?.logo_variant_url;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image size={20} />
          Logo Variante (Branca/Laranja)
        </CardTitle>
        <CardDescription>
          Gerencie a versão alternativa da logo para uso em fundos escuros ou situações especiais.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Variante Atual */}
        {getCurrentLogoVariantUrl() && (
          <div>
            <Label className="text-sm font-medium">Logo Variante Atual</Label>
            <div className="mt-2 p-4 border rounded-lg bg-gray-900 flex justify-center">
              <img
                src={getCurrentLogoVariantUrl()!}
                alt="Logo variante atual"
                className="h-12 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/img/placeholder.png';
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Última atualização: {settings?.updated_at ? new Date(settings.updated_at).toLocaleDateString('pt-BR') : 'N/A'}
            </p>
          </div>
        )}

        {!getCurrentLogoVariantUrl() && (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <Image size={48} className="mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">Nenhuma logo variante configurada</p>
          </div>
        )}

        {/* Upload Nova Logo Variante */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="logo-variant-upload" className="text-sm font-medium">
              Nova Logo Variante
            </Label>
            <Input
              id="logo-variant-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="mt-2"
              disabled={isUploading}
            />
            <div className="flex items-start gap-2 mt-2 text-xs text-gray-500">
              <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
              <div>
                <p>Formatos aceitos: PNG, JPG, JPEG, SVG</p>
                <p>Tamanho máximo: 5MB</p>
                <p>Recomendação: Logo branca com detalhes em laranja</p>
                <p>Dimensões recomendadas: 200x60px ou proporção similar</p>
              </div>
            </div>
          </div>

          {/* Preview da nova logo variante */}
          {previewUrl && (
            <div>
              <Label className="text-sm font-medium">Preview</Label>
              <div className="mt-2 space-y-2">
                {/* Preview em fundo claro */}
                <div className="p-4 border rounded-lg bg-white">
                  <p className="text-xs text-gray-600 mb-2">Em fundo claro:</p>
                  <img
                    src={previewUrl}
                    alt="Preview da nova logo variante - fundo claro"
                    className="h-12 w-auto object-contain"
                  />
                </div>
                {/* Preview em fundo escuro */}
                <div className="p-4 border rounded-lg bg-gray-900">
                  <p className="text-xs text-gray-300 mb-2">Em fundo escuro:</p>
                  <img
                    src={previewUrl}
                    alt="Preview da nova logo variante - fundo escuro"
                    className="h-12 w-auto object-contain"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Botão de Upload */}
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="w-full sm:w-auto"
          >
            {isUploading ? (
              <LoadingState text="Fazendo upload..." />
            ) : (
              <>
                <Upload size={16} className="mr-2" />
                Atualizar Logo Variante
              </>
            )}
          </Button>
        </div>

        {/* Informações Adicionais */}
        <div className="bg-orange-50 p-4 rounded-lg">
          <h4 className="font-medium text-orange-900 mb-2">Quando usar a logo variante:</h4>
          <ul className="text-sm text-orange-800 space-y-1">
            <li>• Em fundos escuros (headers dark mode, footers, etc.)</li>
            <li>• Em materiais impressos com cores de fundo</li>
            <li>• Em situações onde a logo principal não tem contraste suficiente</li>
            <li>• Para manter consistência visual em diferentes contextos</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default LogoVariantUploadSection;
