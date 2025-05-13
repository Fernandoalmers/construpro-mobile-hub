
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
  }, [initialData, open]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    // Simple validation
    const requiredFields: (keyof Address)[] = ['nome', 'cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: `Por favor, preencha os campos obrigatórios: ${missingFields.join(', ')}`
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving address:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao salvar endereço. Tente novamente."
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
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  name="cep"
                  placeholder="00000-000"
                  value={formData.cep}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="logradouro">Logradouro</Label>
                <Input
                  id="logradouro"
                  name="logradouro"
                  placeholder="Rua, Avenida, etc"
                  value={formData.logradouro}
                  onChange={handleChange}
                  required
                />
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
                    required
                  />
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
                  required
                />
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
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    name="estado"
                    placeholder="UF"
                    value={formData.estado}
                    onChange={handleChange}
                    required
                  />
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
