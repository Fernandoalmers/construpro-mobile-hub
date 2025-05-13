
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
import CustomButton from '../common/CustomButton';
import { toast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Address } from '@/services/addressService';
import { useAuth } from '@/context/AuthContext';

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
  
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
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
    }
    setValidationErrors({});
  }, [initialData, open]);

  useEffect(() => {
    // Check authentication status when modal opens
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
    
    // Validate CEP format (optionally)
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
    
    setIsLoading(true);
    
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
      setIsLoading(false);
    }
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
              
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  name="cep"
                  placeholder="00000-000"
                  value={formData.cep}
                  onChange={handleChange}
                  className={validationErrors.cep ? "border-red-500" : ""}
                  required
                />
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
              disabled={isLoading}
            >
              Cancelar
            </CustomButton>
            
            <CustomButton
              type="button"
              variant="primary"
              loading={isLoading}
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
