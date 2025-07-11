
import React, { useState, useEffect } from 'react';
import { MapPin, Search, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useEnhancedCepLookup } from '@/hooks/useEnhancedCepLookup';
import { formatCep } from '@/lib/cep';
import EnhancedCepErrorDisplay from '@/components/common/EnhancedCepErrorDisplay';

interface AddressSectionProps {
  formData: {
    endereco_cep?: string;
    endereco_logradouro?: string;
    endereco_numero?: string;
    endereco_complemento?: string;
    endereco_bairro?: string;
    endereco_cidade?: string;
    endereco_estado?: string;
    zona_entrega?: string;
  };
  onInputChange: (field: string, value: string) => void;
}

const AddressSection: React.FC<AddressSectionProps> = ({ formData, onInputChange }) => {
  const { isLoading, error, cepData, lookupAddress, clearData, retryLookup, lastSearchedCep } = useEnhancedCepLookup();
  const [cepInput, setCepInput] = useState('');

  // Sincronizar cepInput com formData.endereco_cep quando os dados são carregados
  useEffect(() => {
    if (formData.endereco_cep && formData.endereco_cep !== cepInput.replace(/\D/g, '')) {
      setCepInput(formData.endereco_cep);
      console.log('[AddressSection] Syncing CEP input with form data:', formData.endereco_cep);
    }
  }, [formData.endereco_cep]);

  // Auto-fill fields when CEP data is found
  useEffect(() => {
    if (cepData) {
      console.log('[AddressSection] Auto-filling address fields:', cepData);
      onInputChange('endereco_logradouro', cepData.logradouro || '');
      onInputChange('endereco_bairro', cepData.bairro || '');
      onInputChange('endereco_cidade', cepData.localidade || '');
      onInputChange('endereco_estado', cepData.uf || '');
      // Não definir zona_entrega aqui - isso é para contexto de produto, não endereço
    }
  }, [cepData, onInputChange]);

  const handleCepSearch = async () => {
    if (!cepInput.trim()) {
      console.warn('[AddressSection] Empty CEP input');
      return;
    }
    
    console.log('[AddressSection] Searching CEP with enhanced system:', cepInput);
    const sanitizedCep = cepInput.replace(/\D/g, '');
    
    if (sanitizedCep.length !== 8) {
      console.warn('[AddressSection] Invalid CEP length:', sanitizedCep.length);
      return;
    }

    const data = await lookupAddress(sanitizedCep);
    if (data) {
      onInputChange('endereco_cep', sanitizedCep);
      console.log('[AddressSection] Enhanced CEP found and saved:', sanitizedCep, data);
    }
  };

  const handleCepInputChange = (value: string) => {
    setCepInput(value);
    const sanitizedCep = value.replace(/\D/g, '');
    
    onInputChange('endereco_cep', sanitizedCep);
    
    if (sanitizedCep.length < 8) {
      clearData();
    }
    
    console.log('[AddressSection] CEP input changed:', value, '-> sanitized:', sanitizedCep);
  };

  const handleRetry = async () => {
    console.log('[AddressSection] Retrying with enhanced system...');
    await retryLookup();
  };

  const handleManualEntry = () => {
    console.log('[AddressSection] Showing manual entry');
    clearData();
  };

  const handleCepSuggestion = async (suggestedCep: string) => {
    console.log('[AddressSection] Using suggested CEP:', suggestedCep);
    setCepInput(suggestedCep);
    onInputChange('endereco_cep', suggestedCep);
    await lookupAddress(suggestedCep);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-orange-500" />
          Endereço da Loja
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Endereço da sua loja:</p>
              <p className="text-xs">
                Este endereço será usado para identificar sua localização. As configurações de frete e entrega serão definidas individualmente para cada produto.
              </p>
            </div>
          </div>
        </div>

        {/* CEP Field with Enhanced Search */}
        <div className="space-y-2">
          <Label htmlFor="endereco_cep">CEP*</Label>
          <div className="flex gap-2">
            <Input
              id="endereco_cep"
              value={formatCep(cepInput)}
              onChange={(e) => handleCepInputChange(e.target.value)}
              placeholder="00000-000"
              maxLength={9}
              className={error ? 'border-red-500' : cepData ? 'border-green-500' : ''}
            />
            <Button
              type="button"
              onClick={handleCepSearch}
              disabled={isLoading || !cepInput.trim() || cepInput.replace(/\D/g, '').length !== 8}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Buscar
            </Button>
          </div>
          
          {error && (
            <EnhancedCepErrorDisplay
              error={error}
              onRetry={handleRetry}
              onManualEntry={handleManualEntry}
              onCepSuggestion={handleCepSuggestion}
              isRetrying={isLoading}
              searchedCep={lastSearchedCep || undefined}
            />
          )}
          
          {cepData && (
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-green-600" />
              <span className="text-sm text-green-600">
                CEP encontrado: {cepData.localidade} - {cepData.uf}
                {cepData.source && <span className="text-xs ml-1">(fonte: {cepData.source})</span>}
              </span>
            </div>
          )}
        </div>

        {/* Address Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="endereco_logradouro">Logradouro*</Label>
            <Input
              id="endereco_logradouro"
              value={formData.endereco_logradouro || ''}
              onChange={(e) => onInputChange('endereco_logradouro', e.target.value)}
              placeholder="Rua, Avenida..."
              required
            />
          </div>
          
          <div>
            <Label htmlFor="endereco_numero">Número*</Label>
            <Input
              id="endereco_numero"
              value={formData.endereco_numero || ''}
              onChange={(e) => onInputChange('endereco_numero', e.target.value)}
              placeholder="123"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="endereco_complemento">Complemento</Label>
          <Input
            id="endereco_complemento"
            value={formData.endereco_complemento || ''}
            onChange={(e) => onInputChange('endereco_complemento', e.target.value)}
            placeholder="Sala, andar, bloco..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="endereco_bairro">Bairro*</Label>
            <Input
              id="endereco_bairro"
              value={formData.endereco_bairro || ''}
              onChange={(e) => onInputChange('endereco_bairro', e.target.value)}
              placeholder="Centro"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="endereco_cidade">Cidade*</Label>
            <Input
              id="endereco_cidade"
              value={formData.endereco_cidade || ''}
              onChange={(e) => onInputChange('endereco_cidade', e.target.value)}
              placeholder="Sua cidade"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="endereco_estado">Estado*</Label>
            <Input
              id="endereco_estado"
              value={formData.endereco_estado || ''}
              onChange={(e) => onInputChange('endereco_estado', e.target.value)}
              placeholder="MG"
              maxLength={2}
              required
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AddressSection;
