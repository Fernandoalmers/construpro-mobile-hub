
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useEnhancedCepLookup } from '@/hooks/useEnhancedCepLookup';
import { useAddresses } from '@/hooks/useAddresses';
import { formatCep } from '@/lib/cep';
import EnhancedCepErrorDisplay from '@/components/common/EnhancedCepErrorDisplay';
import { Search, CheckCircle, Plus, Loader2 } from 'lucide-react';

interface QuickAddressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddressAdded?: () => void;
}

const QuickAddressModal: React.FC<QuickAddressModalProps> = ({
  open,
  onOpenChange,
  onAddressAdded
}) => {
  const { isLoading, error, cepData, lookupAddress, clearData, retryLookup, lastSearchedCep } = useEnhancedCepLookup();
  const { addAddress } = useAddresses();
  const [cepInput, setCepInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showFullForm, setShowFullForm] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    numero: '',
    complemento: '',
    logradouro: '',
    bairro: '',
    cidade: '',
    estado: ''
  });

  useEffect(() => {
    if (!open) {
      setCepInput('');
      setFormData({ 
        nome: '', 
        numero: '', 
        complemento: '',
        logradouro: '',
        bairro: '',
        cidade: '',
        estado: ''
      });
      setShowFullForm(false);
      clearData();
    }
  }, [open, clearData]);

  // Auto-fill fields when CEP data is found
  useEffect(() => {
    if (cepData) {
      setFormData(prev => ({
        ...prev,
        logradouro: cepData.logradouro || '',
        bairro: cepData.bairro || '',
        cidade: cepData.localidade || '',
        estado: cepData.uf || ''
      }));
    }
  }, [cepData]);

  const handleCepSearch = async () => {
    if (!cepInput.trim()) {
      toast({
        variant: "destructive",
        title: "CEP obrigatório",
        description: "Por favor, digite um CEP para buscar"
      });
      return;
    }
    
    const sanitizedCep = cepInput.replace(/\D/g, '');
    
    if (sanitizedCep.length !== 8) {
      toast({
        variant: "destructive",
        title: "CEP inválido",
        description: "CEP deve ter 8 dígitos"
      });
      return;
    }

    console.log('[QuickAddressModal] Buscando CEP com sistema aprimorado:', sanitizedCep);
    const result = await lookupAddress(sanitizedCep);
    
    setShowFullForm(true);
    setFormData(prev => ({ ...prev, nome: 'Endereço Principal' }));
    
    if (result) {
      toast({
        title: "CEP encontrado!",
        description: `${result.localidade} - ${result.uf} (fonte: ${result.source})`
      });
    }
  };

  const handleCepInputChange = (value: string) => {
    setCepInput(value);
    
    const sanitizedCep = value.replace(/\D/g, '');
    if (sanitizedCep.length < 8) {
      setShowFullForm(false);
      clearData();
    }
  };

  const handleRetry = async () => {
    console.log('[QuickAddressModal] Tentando novamente com sistema aprimorado...');
    await retryLookup();
    setShowFullForm(true);
    setFormData(prev => ({ ...prev, nome: 'Endereço Principal' }));
  };

  const handleManualEntry = () => {
    console.log('[QuickAddressModal] Mostrando entrada manual');
    setShowFullForm(true);
    setFormData(prev => ({ ...prev, nome: 'Endereço Principal' }));
  };

  const handleCepSuggestion = async (suggestedCep: string) => {
    console.log('[QuickAddressModal] Usando CEP sugerido:', suggestedCep);
    setCepInput(suggestedCep);
    const result = await lookupAddress(suggestedCep);
    setShowFullForm(true);
    setFormData(prev => ({ ...prev, nome: 'Endereço Principal' }));
    
    if (result) {
      toast({
        title: "CEP encontrado!",
        description: `${result.localidade} - ${result.uf}`
      });
    }
  };

  const handleSaveAddress = async () => {
    // Validate required fields
    if (!formData.numero.trim()) {
      toast({
        variant: "destructive",
        title: "Número obrigatório",
        description: "Por favor, preencha o número do endereço"
      });
      return;
    }

    if (!formData.logradouro.trim()) {
      toast({
        variant: "destructive",
        title: "Logradouro obrigatório",
        description: "Por favor, preencha o logradouro"
      });
      return;
    }

    if (!formData.bairro.trim()) {
      toast({
        variant: "destructive",
        title: "Bairro obrigatório",
        description: "Por favor, preencha o bairro"
      });
      return;
    }

    if (!formData.cidade.trim()) {
      toast({
        variant: "destructive",
        title: "Cidade obrigatória",
        description: "Por favor, preencha a cidade"
      });
      return;
    }

    if (!formData.estado.trim()) {
      toast({
        variant: "destructive",
        title: "Estado obrigatório",
        description: "Por favor, preencha o estado"
      });
      return;
    }

    setIsSaving(true);

    try {
      await addAddress({
        nome: formData.nome || 'Endereço Principal',
        cep: cepInput.replace(/\D/g, ''),
        logradouro: formData.logradouro,
        numero: formData.numero,
        complemento: formData.complemento,
        bairro: formData.bairro,
        cidade: formData.cidade,
        estado: formData.estado.toUpperCase(),
        principal: true
      });

      toast({
        title: "Endereço adicionado!",
        description: "Endereço principal adicionado com sucesso!"
      });

      onOpenChange(false);
      onAddressAdded?.();
    } catch (error) {
      console.error('Erro ao salvar endereço:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Erro ao salvar endereço. Tente novamente."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isCepValid = cepInput.replace(/\D/g, '').length === 8;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Endereço para Entrega
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* CEP Field with Enhanced Search */}
          <div className="space-y-2">
            <Label htmlFor="cep">CEP*</Label>
            <div className="flex gap-2">
              <Input
                id="cep"
                value={formatCep(cepInput)}
                onChange={(e) => handleCepInputChange(e.target.value)}
                placeholder="00000-000"
                maxLength={9}
                className={error ? 'border-red-500' : cepData ? 'border-green-500' : ''}
              />
              <Button
                type="button"
                onClick={handleCepSearch}
                disabled={isLoading || !cepInput.trim() || !isCepValid}
                className="flex items-center gap-2 min-w-[80px]"
                size="sm"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {isLoading ? '' : 'Buscar'}
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
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-600" />
                  <span className="text-sm text-green-600 font-medium">
                    CEP encontrado: {cepData.localidade} - {cepData.uf}
                  </span>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-medium">{cepData.logradouro}</p>
                  <p className="text-sm text-gray-600">{cepData.bairro}, {cepData.localidade} - {cepData.uf}</p>
                  {cepData.source && (
                    <p className="text-xs text-gray-500 mt-1">Fonte: {cepData.source}</p>
                  )}
                </div>
              </div>
            )}

            {isLoading && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-600 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Sistema aprimorado buscando CEP...
                </p>
              </div>
            )}
          </div>

          {/* Additional fields when form is shown */}
          {showFullForm && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do endereço</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Casa, Trabalho"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="logradouro">Logradouro*</Label>
                <Input
                  id="logradouro"
                  value={formData.logradouro}
                  onChange={(e) => setFormData(prev => ({ ...prev, logradouro: e.target.value }))}
                  placeholder="Rua, Avenida, etc"
                  required
                  className={cepData ? "bg-green-50" : ""}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="numero">Número*</Label>
                  <Input
                    id="numero"
                    value={formData.numero}
                    onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
                    placeholder="123"
                    required
                    className={!formData.numero.trim() ? 'border-amber-300' : ''}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    id="complemento"
                    value={formData.complemento}
                    onChange={(e) => setFormData(prev => ({ ...prev, complemento: e.target.value }))}
                    placeholder="Apto, Bloco"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro*</Label>
                <Input
                  id="bairro"
                  value={formData.bairro}
                  onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
                  placeholder="Bairro"
                  required
                  className={cepData ? "bg-green-50" : ""}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade*</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                    placeholder="Cidade"
                    required
                    className={cepData ? "bg-green-50" : ""}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado*</Label>
                  <Input
                    id="estado"
                    value={formData.estado}
                    onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value.toUpperCase() }))}
                    placeholder="UF"
                    maxLength={2}
                    required
                    className={cepData ? "bg-green-50" : ""}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <div className="flex w-full justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            
            {showFullForm && (
              <Button
                type="button"
                onClick={handleSaveAddress}
                disabled={isSaving || !formData.numero.trim()}
                className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Endereço'
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuickAddressModal;
