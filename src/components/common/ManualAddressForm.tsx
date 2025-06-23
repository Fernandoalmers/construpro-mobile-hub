
import React, { useState } from 'react';
import { MapPin, Edit3, Save, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ManualAddressData {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

interface ManualAddressFormProps {
  initialCep?: string;
  onSubmit: (data: ManualAddressData) => void;
  onCancel: () => void;
}

const ManualAddressForm: React.FC<ManualAddressFormProps> = ({
  initialCep = '',
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<ManualAddressData>({
    cep: initialCep,
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  });

  const [errors, setErrors] = useState<Partial<ManualAddressData>>({});

  const handleChange = (field: keyof ManualAddressData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ManualAddressData> = {};
    
    if (!formData.cep.trim()) newErrors.cep = 'CEP é obrigatório';
    if (!formData.logradouro.trim()) newErrors.logradouro = 'Logradouro é obrigatório';
    if (!formData.numero.trim()) newErrors.numero = 'Número é obrigatório';
    if (!formData.bairro.trim()) newErrors.bairro = 'Bairro é obrigatório';
    if (!formData.cidade.trim()) newErrors.cidade = 'Cidade é obrigatória';
    if (!formData.estado.trim()) newErrors.estado = 'Estado é obrigatório';
    
    // Validate CEP format
    const sanitizedCep = formData.cep.replace(/\D/g, '');
    if (formData.cep && sanitizedCep.length !== 8) {
      newErrors.cep = 'CEP deve ter 8 dígitos';
    }
    
    // Validate state format
    if (formData.estado && formData.estado.length !== 2) {
      newErrors.estado = 'Estado deve ter 2 letras (UF)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Clean and format data before submitting
      const cleanData = {
        ...formData,
        cep: formData.cep.replace(/\D/g, ''),
        estado: formData.estado.toUpperCase(),
        logradouro: formData.logradouro.trim(),
        bairro: formData.bairro.trim(),
        cidade: formData.cidade.trim(),
      };
      
      onSubmit(cleanData);
    }
  };

  const formatCep = (cep: string): string => {
    const numbers = cep.replace(/\D/g, '');
    if (numbers.length <= 5) {
      return numbers;
    }
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  return (
    <Card className="p-4 border-amber-200 bg-amber-50">
      <div className="flex items-center gap-2 mb-4">
        <Edit3 className="h-5 w-5 text-amber-600" />
        <h3 className="font-medium text-amber-800">Preencher Endereço Manualmente</h3>
        <Badge variant="outline" className="text-amber-700 border-amber-300">
          Entrada Manual
        </Badge>
      </div>
      
      <div className="bg-amber-100 p-3 rounded-lg mb-4">
        <p className="text-sm text-amber-800">
          Como não conseguimos localizar seu CEP automaticamente, você pode preencher 
          os dados manualmente. Verifique se todas as informações estão corretas.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="manual-cep">CEP*</Label>
            <Input
              id="manual-cep"
              value={formatCep(formData.cep)}
              onChange={(e) => handleChange('cep', e.target.value)}
              placeholder="00000-000"
              maxLength={9}
              className={errors.cep ? 'border-red-500' : ''}
            />
            {errors.cep && <p className="text-red-500 text-xs mt-1">{errors.cep}</p>}
          </div>

          <div>
            <Label htmlFor="manual-numero">Número*</Label>
            <Input
              id="manual-numero"
              value={formData.numero}
              onChange={(e) => handleChange('numero', e.target.value)}
              placeholder="123"
              className={errors.numero ? 'border-red-500' : ''}
            />
            {errors.numero && <p className="text-red-500 text-xs mt-1">{errors.numero}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="manual-logradouro">Logradouro*</Label>
          <Input
            id="manual-logradouro"
            value={formData.logradouro}
            onChange={(e) => handleChange('logradouro', e.target.value)}
            placeholder="Rua, Avenida, etc."
            className={errors.logradouro ? 'border-red-500' : ''}
          />
          {errors.logradouro && <p className="text-red-500 text-xs mt-1">{errors.logradouro}</p>}
        </div>

        <div>
          <Label htmlFor="manual-complemento">Complemento</Label>
          <Input
            id="manual-complemento"
            value={formData.complemento}
            onChange={(e) => handleChange('complemento', e.target.value)}
            placeholder="Apto, Bloco, etc."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="manual-bairro">Bairro*</Label>
            <Input
              id="manual-bairro"
              value={formData.bairro}
              onChange={(e) => handleChange('bairro', e.target.value)}
              placeholder="Centro"
              className={errors.bairro ? 'border-red-500' : ''}
            />
            {errors.bairro && <p className="text-red-500 text-xs mt-1">{errors.bairro}</p>}
          </div>

          <div>
            <Label htmlFor="manual-cidade">Cidade*</Label>
            <Input
              id="manual-cidade"
              value={formData.cidade}
              onChange={(e) => handleChange('cidade', e.target.value)}
              placeholder="Capelinha"
              className={errors.cidade ? 'border-red-500' : ''}
            />
            {errors.cidade && <p className="text-red-500 text-xs mt-1">{errors.cidade}</p>}
          </div>

          <div>
            <Label htmlFor="manual-estado">Estado*</Label>
            <Input
              id="manual-estado"
              value={formData.estado}
              onChange={(e) => handleChange('estado', e.target.value.toUpperCase())}
              placeholder="MG"
              maxLength={2}
              className={errors.estado ? 'border-red-500' : ''}
            />
            {errors.estado && <p className="text-red-500 text-xs mt-1">{errors.estado}</p>}
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-700">
            <Save className="h-4 w-4 mr-2" />
            Salvar Endereço
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ManualAddressForm;
