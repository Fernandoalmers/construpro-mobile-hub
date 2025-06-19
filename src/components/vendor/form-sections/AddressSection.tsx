
import React, { useState, useEffect } from 'react';
import { MapPin, Search, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCepLookup } from '@/hooks/useCepLookup';
import { formatCep } from '@/lib/cep';

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
  const { isLoading, error, cepData, lookupAddress } = useCepLookup();
  const [cepInput, setCepInput] = useState(formData.endereco_cep || '');

  // Auto-fill fields when CEP data is found
  useEffect(() => {
    if (cepData) {
      onInputChange('endereco_logradouro', cepData.logradouro);
      onInputChange('endereco_bairro', cepData.bairro);
      onInputChange('endereco_cidade', cepData.localidade);
      onInputChange('endereco_estado', cepData.uf);
      onInputChange('zona_entrega', cepData.zona_entrega || 'outras');
    }
  }, [cepData, onInputChange]);

  const handleCepSearch = async () => {
    if (!cepInput.trim()) return;
    
    const data = await lookupAddress(cepInput);
    if (data) {
      onInputChange('endereco_cep', cepInput.replace(/\D/g, ''));
    }
  };

  const handleCepInputChange = (value: string) => {
    setCepInput(value);
    onInputChange('endereco_cep', value.replace(/\D/g, ''));
  };

  const getZoneBadge = () => {
    if (!formData.zona_entrega) return null;
    
    const zoneConfig = {
      local: { label: 'Zona Local', color: 'bg-green-500', text: 'entrega em até 48h' },
      regional: { label: 'Zona Regional', color: 'bg-blue-500', text: 'até 7 dias úteis' },
      outras: { label: 'Outras Localidades', color: 'bg-gray-500', text: 'frete a combinar' },
    };
    
    const config = zoneConfig[formData.zona_entrega as keyof typeof zoneConfig];
    if (!config) return null;
    
    return (
      <Badge className={`${config.color} hover:${config.color}/80 text-white`}>
        {config.label} - {config.text}
      </Badge>
    );
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
                Este endereço será usado para determinar automaticamente se a entrega é local ou se precisa calcular frete.
                Clientes da mesma cidade terão entrega local (até 48h), demais localidades terão frete a combinar.
              </p>
            </div>
          </div>
        </div>

        {/* CEP Field with Search */}
        <div className="space-y-2">
          <Label htmlFor="endereco_cep">CEP*</Label>
          <div className="flex gap-2">
            <Input
              id="endereco_cep"
              value={formatCep(cepInput)}
              onChange={(e) => handleCepInputChange(e.target.value)}
              placeholder="00000-000"
              maxLength={9}
              className={error ? 'border-red-500' : ''}
            />
            <Button
              type="button"
              onClick={handleCepSearch}
              disabled={isLoading || !cepInput.trim()}
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
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle size={14} />
              {error}
            </p>
          )}
          
          {cepData && (
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-green-600" />
              <span className="text-sm text-green-600">CEP encontrado!</span>
              {getZoneBadge()}
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
              placeholder="Capelinha"
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

        {/* Delivery Zone Preview */}
        {formData.zona_entrega && (
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <MapPin size={16} />
              Zona de Entrega Detectada:
            </h4>
            <div className="flex items-center gap-2">
              {getZoneBadge()}
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Esta informação será usada para determinar automaticamente se a entrega é local para seus clientes.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AddressSection;
