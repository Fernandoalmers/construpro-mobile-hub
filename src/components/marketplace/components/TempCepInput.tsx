
import React, { useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TempCepInputProps {
  onCepSubmit: (cep: string) => void;
  loading?: boolean;
}

const TempCepInput: React.FC<TempCepInputProps> = ({ onCepSubmit, loading = false }) => {
  const [tempCep, setTempCep] = useState('');

  const formatCep = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara 00000-000
    if (numbers.length <= 5) {
      return numbers;
    } else {
      return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setTempCep(formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCep = tempCep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      onCepSubmit(cleanCep);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center">
      <div className="flex-1">
        <Input
          type="text"
          placeholder="Digite seu CEP"
          value={tempCep}
          onChange={handleCepChange}
          maxLength={9}
          className="text-sm"
        />
      </div>
      <Button 
        type="submit" 
        size="sm" 
        disabled={tempCep.replace(/\D/g, '').length !== 8 || loading}
        className="flex items-center gap-1"
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <MapPin className="w-3 h-3" />
        )}
        Consultar
      </Button>
    </form>
  );
};

export default TempCepInput;
