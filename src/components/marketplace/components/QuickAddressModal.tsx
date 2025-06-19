
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
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { useCepLookup } from '@/hooks/useCepLookup';
import { useAddresses } from '@/hooks/useAddresses';
import { formatCep } from '@/lib/cep';
import { Search, AlertCircle, CheckCircle, MapPin, Plus, Loader2 } from 'lucide-react';

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
  const { isLoading, error, cepData, lookupAddress, clearData } = useCepLookup();
  const { addAddress } = useAddresses();
  const [cepInput, setCepInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showFullForm, setShowFullForm] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    numero: '',
    complemento: ''
  });

  useEffect(() => {
    if (!open) {
      setCepInput('');
      setFormData({ nome: '', numero: '', complemento: '' });
      setShowFullForm(false);
      clearData();
    }
  }, [open, clearData]);

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

    console.log('[QuickAddressModal] Buscando CEP:', sanitizedCep);
    const result = await lookupAddress(sanitizedCep);
    
    if (result) {
      setShowFullForm(true);
      setFormData(prev => ({ ...prev, nome: 'Endereço Principal' }));
      
      toast({
        title: "CEP encontrado!",
        description: "Dados preenchidos automaticamente. Complete as informações."
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

  const handleSaveAddress = async () => {
    if (!cepData) {
      toast({
        variant: "destructive",
        title: "CEP não encontrado",
        description: "Por favor, busque um CEP válido primeiro"
      });
      return;
    }

    if (!formData.numero.trim()) {
      toast({
        variant: "destructive",
        title: "Número obrigatório",
        description: "Por favor, preencha o número do endereço"
      });
      return;
    }

    setIsSaving(true);

    try {
      await addAddress({
        nome: formData.nome || 'Endereço Principal',
        cep: cepData.cep,
        logradouro: cepData.logradouro,
        numero: formData.numero,
        complemento: formData.complemento,
        bairro: cepData.bairro,
        cidade: cepData.localidade,
        estado: cepData.uf,
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
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              Adicione seu endereço para ver informações precisas sobre entrega e frete.
            </p>
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
              <div className="p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {error}
                </p>
              </div>
            )}
            
            {cepData && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-600" />
                  <span className="text-sm text-green-600 font-medium">CEP válido encontrado!</span>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-medium">{cepData.logradouro}</p>
                  <p className="text-sm text-gray-600">{cepData.bairro}, {cepData.localidade} - {cepData.uf}</p>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-blue-600" />
                  {getZoneBadge()}
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
          </div>

          {/* Additional fields when CEP is found */}
          {showFullForm && cepData && (
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
            
            {showFullForm && cepData && (
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
