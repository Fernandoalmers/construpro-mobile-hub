
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
import { Badge } from '@/components/ui/badge';
import CustomButton from '../common/CustomButton';
import { toast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Address } from '@/services/addressService';
import { useAuth } from '@/context/AuthContext';
import { useCepLookup } from '@/hooks/useCepLookup';
import { formatCep } from '@/lib/cep';
import { Search, AlertCircle, CheckCircle, MapPin } from 'lucide-react';

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
  const { isAuthenticated } = useAuth();
  const { isLoading, error, cepData, lookupAddress, clearData } = useCepLookup();
  const [cepInput, setCepInput] = useState('');
  
  const [formData, setFormData] = useState<Address>({
    nome: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    principal: false
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setCepInput(initialData.cep || '');
    } else {
      setFormData({
        nome: '',
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        principal: false
      });
      setCepInput('');
    }
    setValidationErrors({});
    clearData();
  }, [initialData, open, clearData]);

  useEffect(() => {
    if (open && !isAuthenticated) {
      console.error("User is not authenticated");
      toast({
        variant: "destructive",
        title: "Erro de autenticação",
        description: "Você precisa estar logado para gerenciar endereços."
      });
      onOpenChange(false);
    }
  }, [open, isAuthenticated, onOpenChange]);

  // Auto-fill fields when CEP data is found
  useEffect(() => {
    if (cepData) {
      console.log('[AddAddressModal] Auto-filling address fields:', cepData);
      setFormData(prev => ({
        ...prev,
        cep: cepData.cep,
        logradouro: cepData.logradouro || '',
        bairro: cepData.bairro || '',
        cidade: cepData.localidade || '',
        estado: cepData.uf || ''
      }));
    }
  }, [cepData]);

  const handleCepSearch = async () => {
    if (!cepInput.trim()) {
      console.warn('[AddAddressModal] Empty CEP input');
      return;
    }
    
    console.log('[AddAddressModal] Searching CEP:', cepInput);
    const sanitizedCep = cepInput.replace(/\D/g, '');
    
    if (sanitizedCep.length !== 8) {
      console.warn('[AddAddressModal] Invalid CEP length:', sanitizedCep.length);
      setValidationErrors(prev => ({ ...prev, cep: 'CEP deve ter 8 dígitos' }));
      return;
    }

    await lookupAddress(sanitizedCep);
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
    
    // Clear data if CEP is significantly modified
    const sanitizedCep = value.replace(/\D/g, '');
    if (sanitizedCep.length < 8) {
      clearData();
    }
    
    console.log('[AddAddressModal] CEP input changed:', value, '-> sanitized:', sanitizedCep);
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

  const validateForm = (): boolean => {
    const requiredFields: (keyof Address)[] = ['nome', 'cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado'];
    const errors: Record<string, string> = {};
    
    // Check required fields
    requiredFields.forEach(field => {
      if (!formData[field]) {
        errors[field] = 'Campo obrigatório';
      }
    });
    
    // Validate CEP format
    if (formData.cep && !/^\d{5}-?\d{3}$/.test(formData.cep)) {
      errors.cep = 'CEP inválido. Use o formato 00000-000';
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
    
    console.log("Form submission initiated with data:", formData);
    
    // Validate form
    if (!validateForm()) {
      console.error("Validation failed:", validationErrors);
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios corretamente."
      });
      return;
    }
    
    // Check authentication again before submitting
    if (!isAuthenticated) {
      console.error("User is not authenticated during form submission");
      toast({
        variant: "destructive",
        title: "Erro de autenticação",
        description: "Você precisa estar logado para salvar endereços."
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      console.log("Submitting address data:", formData);
      await onSave(formData);
    } catch (error) {
      console.error('Error saving address:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar endereço. Tente novamente."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getZoneBadge = () => {
    if (!cepData?.zona_entrega) return null;
    
    const zoneConfig = {
      local: { label: 'Zona Local', color: 'bg-green-500', text: 'entrega em até 48h' },
      regional: { label: 'Zona Regional', color: 'bg-blue-500', text: 'até 7 dias úteis' },
      outras: { label: 'Outras Localidades', color: 'bg-gray-500', text: 'frete a combinar' },
    };
    
    const config = zoneConfig[cepData.zona_entrega as keyof typeof zoneConfig];
    if (!config) return null;
    
    return (
      <Badge className={`${config.color} hover:${config.color}/80 text-white`}>
        {config.label} - {config.text}
      </Badge>
    );
  };
  
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

              {/* CEP Field with Search */}
              <div className="space-y-2">
                <Label htmlFor="cep">CEP*</Label>
                <div className="flex gap-2">
                  <Input
                    id="cep"
                    value={formatCep(cepInput)}
                    onChange={(e) => handleCepInputChange(e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                    className={error ? 'border-red-500' : ''}
                  />
                  <Button
                    type="button"
                    onClick={handleCepSearch}
                    disabled={isLoading || !cepInput.trim() || cepInput.replace(/\D/g, '').length !== 8}
                    className="flex items-center gap-2"
                    size="sm"
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
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-green-600" />
                      <span className="text-sm text-green-600">CEP encontrado e dados preenchidos automaticamente!</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-blue-600" />
                      {getZoneBadge()}
                    </div>
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
                  className={validationErrors.logradouro ? "border-red-500" : ""}
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
                  className={validationErrors.bairro ? "border-red-500" : ""}
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
                    className={validationErrors.cidade ? "border-red-500" : ""}
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
                    className={validationErrors.estado ? "border-red-500" : ""}
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
