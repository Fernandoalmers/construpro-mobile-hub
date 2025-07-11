
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
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import CustomButton from '../common/CustomButton';
import { toast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Address } from '@/services/addressService';
import { useAuth } from '@/context/AuthContext';
import { useEnhancedCepLookup } from '@/hooks/useEnhancedCepLookup';
import { formatCep } from '@/lib/cep';
import EnhancedCepErrorDisplay from '@/components/common/EnhancedCepErrorDisplay';
import { Search, CheckCircle, Loader2 } from 'lucide-react';

interface AddAddressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (address: Address) => void;
  initialData?: Address | null;
}

const AddAddressModal: React.FC<AddAddressModalProps> = ({
  open,
  onOpenChange,
  onSave,
  initialData
}) => {
  const { isAuthenticated, user } = useAuth();
  const { isLoading, error, cepData, lookupAddress, clearData, retryLookup, lastSearchedCep } = useEnhancedCepLookup();
  const [cepInput, setCepInput] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [formData, setFormData] = useState<Address>({
    id: '',
    user_id: user?.id || '',
    nome: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    principal: false,
    created_at: '',
    updated_at: ''
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setCepInput(initialData.cep || '');
      setIsEditMode(true);
    } else {
      setFormData({
        id: '',
        user_id: user?.id || '',
        nome: '',
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        principal: false,
        created_at: '',
        updated_at: ''
      });
      setCepInput('');
      setIsEditMode(false);
    }
    setValidationErrors({});
    clearData();
  }, [initialData, open, clearData, user?.id]);

  useEffect(() => {
    if (open && !isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Erro de autenticação",
        description: "Você precisa estar logado para gerenciar endereços."
      });
      onOpenChange(false);
    }
  }, [open, isAuthenticated, onOpenChange]);

  // Auto-fill fields when CEP data is found (but allow editing)
  useEffect(() => {
    if (cepData) {
      setFormData(prev => ({
        ...prev,
        cep: cepData.cep,
        logradouro: cepData.logradouro,
        bairro: cepData.bairro,
        cidade: cepData.localidade,
        estado: cepData.uf
      }));
      
      // Clear validation errors for auto-filled fields
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated.cep;
        delete updated.logradouro;
        delete updated.bairro;
        delete updated.cidade;
        delete updated.estado;
        return updated;
      });
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
      setValidationErrors(prev => ({ ...prev, cep: 'CEP deve ter 8 dígitos' }));
      toast({
        variant: "destructive",
        title: "CEP inválido",
        description: "CEP deve ter 8 dígitos"
      });
      return;
    }

    const result = await lookupAddress(sanitizedCep);
    if (result) {
      toast({
        title: "CEP encontrado!",
        description: `Endereço em ${result.localidade}-${result.uf} preenchido automaticamente.`
      });
    }
  };

  const handleCepInputChange = (value: string) => {
    setCepInput(value);
    
    // Clear validation error when field is changed
    if (validationErrors.cep) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated.cep;
        return updated;
      });
    }
    
    // Clear CEP data if user changes CEP significantly
    const sanitizedCep = value.replace(/\D/g, '');
    if (sanitizedCep.length < 8 && cepData) {
      clearData();
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when field is changed
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleRetry = async () => {
    await retryLookup();
  };

  const handleManualEntry = () => {
    setValidationErrors({});
  };

  const handleCepSuggestion = async (suggestedCep: string) => {
    setCepInput(suggestedCep);
    const result = await lookupAddress(suggestedCep);
    if (result) {
      toast({
        title: "CEP encontrado!",
        description: `Endereço em ${result.localidade}-${result.uf} preenchido automaticamente.`
      });
    }
  };

  const validateForm = (): boolean => {
    const requiredFields: (keyof Address)[] = ['nome', 'cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado'];
    const errors: Record<string, string> = {};
    
    // Check required fields
    requiredFields.forEach(field => {
      const value = formData[field];
      if (!value || (typeof value === 'string' && !value.trim())) {
        errors[field] = 'Campo obrigatório';
      }
    });
    
    // Validate CEP format (relaxed - only check format, not API validation)
    if (formData.cep && !/^\d{8}$/.test(formData.cep.replace(/\D/g, ''))) {
      errors.cep = 'CEP inválido. Use 8 dígitos';
    }
    
    // Set validation errors
    setValidationErrors(errors);
    
    // Return true if no errors
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    // Validate form
    if (!validateForm()) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios."
      });
      return;
    }
    
    // Check authentication again before submitting
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Erro de autenticação",
        description: "Você precisa estar logado para salvar endereços."
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Prepare final data for saving
      const addressToSave = {
        ...formData,
        user_id: user?.id || formData.user_id,
        cep: formData.cep.replace(/\D/g, '') // Ensure CEP is without formatting
      };
      
      await onSave(addressToSave);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Erro ao salvar endereço. Tente novamente."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isCepValid = cepInput.replace(/\D/g, '').length === 8;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] p-0 overflow-hidden w-full sm:max-w-[425px]">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>
            {initialData ? 'Editar Endereço' : 'Adicionar Endereço'}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <div className="px-6">
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do endereço</Label>
                <Input
                  id="nome"
                  name="nome"
                  placeholder="Ex: Casa, Trabalho"
                  value={formData.nome}
                  onChange={handleChange}
                  className={validationErrors.nome ? "border-red-500" : ""}
                  required
                />
                {validationErrors.nome && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.nome}</p>
                )}
              </div>

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
                    className={error ? 'border-red-500' : cepData ? 'border-green-500' : validationErrors.cep ? 'border-red-500' : ''}
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
                        CEP válido encontrado!
                      </span>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm font-medium">{cepData.logradouro}</p>
                      <p className="text-sm text-gray-600">{cepData.bairro}, {cepData.localidade} - {cepData.uf}</p>
                    </div>
                  </div>
                )}

                {isLoading && (
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-600 flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      Buscando CEP... Aguarde alguns segundos.
                    </p>
                  </div>
                )}

                {validationErrors.cep && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.cep}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="logradouro">Logradouro</Label>
                <Input
                  id="logradouro"
                  name="logradouro"
                  placeholder="Rua, Avenida, etc"
                  value={formData.logradouro}
                  onChange={handleChange}
                  className={validationErrors.logradouro ? "border-red-500" : cepData ? "bg-green-50" : ""}
                  required
                />
                {validationErrors.logradouro && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.logradouro}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    name="numero"
                    placeholder="123"
                    value={formData.numero}
                    onChange={handleChange}
                    className={validationErrors.numero ? "border-red-500" : ""}
                    required
                  />
                  {validationErrors.numero && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.numero}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    id="complemento"
                    name="complemento"
                    placeholder="Apto, Bloco, etc"
                    value={formData.complemento}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  name="bairro"
                  placeholder="Bairro"
                  value={formData.bairro}
                  onChange={handleChange}
                  className={validationErrors.bairro ? "border-red-500" : cepData ? "bg-green-50" : ""}
                  required
                />
                {validationErrors.bairro && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.bairro}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    name="cidade"
                    placeholder="Cidade"
                    value={formData.cidade}
                    onChange={handleChange}
                    className={validationErrors.cidade ? "border-red-500" : cepData ? "bg-green-50" : ""}
                    required
                  />
                  {validationErrors.cidade && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.cidade}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    name="estado"
                    placeholder="UF"
                    value={formData.estado}
                    onChange={handleChange}
                    className={validationErrors.estado ? "border-red-500" : cepData ? "bg-green-50" : ""}
                    maxLength={2}
                    required
                  />
                  {validationErrors.estado && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.estado}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="principal"
                  checked={formData.principal}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, principal: checked }))
                  }
                />
                <Label htmlFor="principal">Definir como endereço principal</Label>
              </div>
            </form>
          </div>
        </ScrollArea>
        
        <DialogFooter className="px-6 py-4 border-t">
          <div className="flex w-full justify-end gap-2">
            <CustomButton
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancelar
            </CustomButton>
            
            <CustomButton
              type="button"
              variant="primary"
              loading={isSaving}
              onClick={handleSubmit}
            >
              {initialData ? 'Salvar' : 'Adicionar'}
            </CustomButton>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddAddressModal;
