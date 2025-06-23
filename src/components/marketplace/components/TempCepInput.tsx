import React, { useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEnhancedCepLookup } from '@/hooks/useEnhancedCepLookup';
import EnhancedCepErrorDisplay from '@/components/common/EnhancedCepErrorDisplay';
import ManualAddressForm from '@/components/common/ManualAddressForm';

interface TempCepInputProps {
  onCepSubmit: (cep: string) => void;
  loading?: boolean;
}

const TempCepInput: React.FC<TempCepInputProps> = ({ onCepSubmit, loading = false }) => {
  const [tempCep, setTempCep] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);
  
  const { 
    isLoading, 
    error, 
    cepData, 
    lookupAddress, 
    retryLookup, 
    lastSearchedCep,
    clearData 
  } = useEnhancedCepLookup();

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) {
      return numbers;
    } else {
      return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setTempCep(formatted);
    
    if (formatted.replace(/\D/g, '').length < 8) {
      clearData();
      setShowManualForm(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCep = tempCep.replace(/\D/g, '');
    
    if (cleanCep.length === 8) {
      console.log('[TempCepInput] Iniciando busca aprimorada para CEP:', cleanCep);
      const result = await lookupAddress(cleanCep);
      
      if (result) {
        onCepSubmit(cleanCep);
        setShowManualForm(false);
      }
    }
  };

  const handleRetry = async () => {
    console.log('[TempCepInput] Tentando novamente com sistema aprimorado...');
    await retryLookup();
  };

  const handleShowManualForm = () => {
    console.log('[TempCepInput] Mostrando formulário manual');
    setShowManualForm(true);
  };

  const handleCepSuggestion = async (suggestedCep: string) => {
    console.log('[TempCepInput] Usando CEP sugerido:', suggestedCep);
    setTempCep(formatCep(suggestedCep));
    const result = await lookupAddress(suggestedCep);
    if (result) {
      onCepSubmit(suggestedCep);
    }
  };

  const handleManualSubmit = (data: any) => {
    console.log('[TempCepInput] Endereço manual enviado:', data);
    onCepSubmit(data.cep);
    setShowManualForm(false);
    setTempCep(formatCep(data.cep));
  };

  const handleCancelManualForm = () => {
    console.log('[TempCepInput] Cancelando formulário manual');
    setShowManualForm(false);
  };

  if (showManualForm) {
    return (
      <ManualAddressForm
        initialCep={tempCep.replace(/\D/g, '')}
        onSubmit={handleManualSubmit}
        onCancel={handleCancelManualForm}
      />
    );
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Digite seu CEP"
            value={tempCep}
            onChange={handleCepChange}
            maxLength={9}
            className={`text-sm ${error ? 'border-red-500' : cepData ? 'border-green-500' : ''}`}
          />
        </div>
        <Button 
          type="submit" 
          size="sm" 
          disabled={tempCep.replace(/\D/g, '').length !== 8 || isLoading || loading}
          className="flex items-center gap-1"
        >
          {isLoading || loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <MapPin className="w-3 h-3" />
          )}
          Consultar
        </Button>
      </form>

      {error && (
        <EnhancedCepErrorDisplay
          error={error}
          onRetry={handleRetry}
          onManualEntry={handleShowManualForm}
          onCepSuggestion={handleCepSuggestion}
          isRetrying={isLoading}
          searchedCep={lastSearchedCep || undefined}
        />
      )}

      {cepData && (
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              CEP encontrado! (Sistema aprimorado)
            </span>
          </div>
          <p className="text-sm font-medium">{cepData.logradouro}</p>
          <p className="text-sm text-gray-600">{cepData.bairro}, {cepData.localidade} - {cepData.uf}</p>
          {cepData.source && (
            <p className="text-xs text-gray-500 mt-1">Fonte: {cepData.source}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TempCepInput;
