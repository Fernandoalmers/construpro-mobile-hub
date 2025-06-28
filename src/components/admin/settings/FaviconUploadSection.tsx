
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Image, AlertCircle } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import LoadingState from '@/components/common/LoadingState';

const FaviconUploadSection: React.FC = () => {
  const { settings, isUploading, uploadFavicon } = useSiteSettings();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem (PNG, JPG, ICO)');
      return;
    }

    // Validar tamanho (máximo 2MB para favicon)
    if (file.size > 2 * 1024 * 1024) {
      alert('O favicon deve ter no máximo 2MB');
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

    const success = await uploadFavicon(selectedFile);
    if (success) {
      setSelectedFile(null);
      setPreviewUrl(null);
      
      // Limpar input
      const fileInput = document.getElementById('favicon-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  const getCurrentFaviconUrl = () => {
    return settings?.favicon_url || '/favicon.ico';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image size={20} />
          Favicon
        </CardTitle>
        <CardDescription>
          Gerencie o ícone que aparece na aba do navegador. Ideal: 32x32px ou 64x64px.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Favicon Atual */}
        <div>
          <Label className="text-sm font-medium">Favicon Atual</Label>
          <div className="mt-2 p-4 border rounded-lg bg-gray-50 flex items-center gap-3">
            <img
              src={getCurrentFaviconUrl()}
              alt="Favicon atual"
              className="w-8 h-8 object-contain"
              onError={(e) => {
                e.currentTarget.src = '/favicon.ico';
              }}
            />
            <span className="text-sm text-gray-600">32x32px</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Última atualização: {settings?.updated_at ? new Date(settings.updated_at).toLocaleDateString('pt-BR') : 'N/A'}
          </p>
        </div>

        {/* Upload Novo Favicon */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="favicon-upload" className="text-sm font-medium">
              Novo Favicon
            </Label>
            <Input
              id="favicon-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="mt-2"
              disabled={isUploading}
            />
            <div className="flex items-start gap-2 mt-2 text-xs text-gray-500">
              <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
              <div>
                <p>Formatos aceitos: PNG, JPG, ICO</p>
                <p>Tamanho máximo: 2MB</p>
                <p>Dimensões ideais: 32x32px, 64x64px</p>
              </div>
            </div>
          </div>

          {/* Preview do novo favicon */}
          {previewUrl && (
            <div>
              <Label className="text-sm font-medium">Preview</Label>
              <div className="mt-2 p-4 border rounded-lg bg-gray-50">
                <img
                  src={previewUrl}
                  alt="Preview do novo favicon"
                  className="w-8 h-8 object-contain"
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
                Atualizar Favicon
              </>
            )}
          </Button>
        </div>

        {/* Informações Adicionais */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">O que acontece quando você atualiza o favicon:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• O ícone será atualizado automaticamente nas abas do navegador</li>
            <li>• Pode levar alguns minutos para aparecer devido ao cache do navegador</li>
            <li>• O favicon anterior será removido do servidor</li>
            <li>• Funciona em todos os navegadores modernos</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default FaviconUploadSection;
