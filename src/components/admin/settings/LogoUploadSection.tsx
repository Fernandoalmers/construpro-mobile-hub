
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Image, AlertCircle } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import LoadingState from '@/components/common/LoadingState';

const LogoUploadSection: React.FC = () => {
  const { settings, isLoading, isUploading, uploadLogo } = useSiteSettings();
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

    const success = await uploadLogo(selectedFile);
    if (success) {
      setSelectedFile(null);
      setPreviewUrl(null);
      
      // Limpar input
      const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  const getCurrentLogoUrl = () => {
    return settings?.logo_url || '/lovable-uploads/7520caa6-efbb-4176-9c9f-8d37f88c7ff1.png';
  };

  if (isLoading) {
    return <LoadingState text="Carregando configurações..." />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image size={20} />
          Logo da Matershop
        </CardTitle>
        <CardDescription>
          Gerencie a logo principal do site. A logo será exibida no header e será usada como favicon.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Atual */}
        <div>
          <Label className="text-sm font-medium">Logo Atual</Label>
          <div className="mt-2 p-4 border rounded-lg bg-gray-50">
            <img
              src={getCurrentLogoUrl()}
              alt="Logo atual da Matershop"
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

        {/* Upload Nova Logo */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="logo-upload" className="text-sm font-medium">
              Nova Logo
            </Label>
            <Input
              id="logo-upload"
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
                <p>Dimensões recomendadas: 200x60px ou proporção similar</p>
              </div>
            </div>
          </div>

          {/* Preview da nova logo */}
          {previewUrl && (
            <div>
              <Label className="text-sm font-medium">Preview</Label>
              <div className="mt-2 p-4 border rounded-lg bg-gray-50">
                <img
                  src={previewUrl}
                  alt="Preview da nova logo"
                  className="h-12 w-auto object-contain"
                />
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
                Atualizar Logo
              </>
            )}
          </Button>
        </div>

        {/* Informações Adicionais */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">O que acontece quando você atualiza a logo:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• A logo será exibida no header de todas as páginas</li>
            <li>• O favicon do site será atualizado automaticamente</li>
            <li>• A logo anterior será removida do servidor</li>
            <li>• As alterações são aplicadas imediatamente</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default LogoUploadSection;
