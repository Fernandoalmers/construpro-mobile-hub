
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { Loader2 } from 'lucide-react';
import { createProductRestriction } from '@/services/vendor/deliveryZones';
import { useCepLookup } from '@/hooks/useCepLookup';

interface ProductRestrictionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  vendorId: string;
  products: any[];
}

const ProductRestrictionModal: React.FC<ProductRestrictionModalProps> = ({
  open,
  onOpenChange,
  onClose,
  vendorId,
  products
}) => {
  const { lookupAddress } = useCepLookup();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    zone_type: 'cep_specific' as 'cep_specific' | 'cep_range' | 'ibge' | 'cidade',
    zone_value: '',
    restriction_type: 'freight_on_demand' as 'not_delivered' | 'freight_on_demand' | 'higher_fee',
    restriction_message: 'Frete a combinar para esta região'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.product_id || !formData.zone_value.trim() || !formData.restriction_message.trim()) {
      toast.error('Todos os campos são obrigatórios');
      return;
    }

    // Validate zone value based on type
    if (formData.zone_type === 'cep_specific') {
      const cleanCep = formData.zone_value.replace(/\D/g, '');
      if (cleanCep.length !== 8) {
        toast.error('CEP deve ter 8 dígitos');
        return;
      }
      
      try {
        const cepData = await lookupAddress(cleanCep);
        if (!cepData) {
          toast.error('CEP não encontrado. Verifique o número digitado.');
          return;
        }
      } catch (error) {
        toast.error('Erro ao validar CEP');
        return;
      }
    } else if (formData.zone_type === 'cep_range') {
      const parts = formData.zone_value.split('-');
      if (parts.length !== 2) {
        toast.error('Faixa de CEP deve ter formato: 01000000-01999999');
        return;
      }
      
      const start = parts[0].replace(/\D/g, '');
      const end = parts[1].replace(/\D/g, '');
      
      if (start.length !== 8 || end.length !== 8) {
        toast.error('CEPs na faixa devem ter 8 dígitos cada');
        return;
      }
      
      if (parseInt(start) >= parseInt(end)) {
        toast.error('CEP inicial deve ser menor que o CEP final');
        return;
      }
    }

    try {
      setLoading(true);
      
      const restrictionData = {
        vendor_id: vendorId,
        active: true,
        ...formData
      };

      await createProductRestriction(restrictionData);
      toast.success('Restrição de produto criada');
      
      // Reset form
      setFormData({
        product_id: '',
        zone_type: 'cep_specific',
        zone_value: '',
        restriction_type: 'freight_on_demand',
        restriction_message: 'Frete a combinar para esta região'
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving product restriction:', error);
      toast.error('Erro ao salvar restrição');
    } finally {
      setLoading(false);
    }
  };

  const getPlaceholderByType = () => {
    switch (formData.zone_type) {
      case 'cep_specific':
        return '01000000 ou 01000-000';
      case 'cep_range':
        return '01000000-01999999';
      case 'ibge':
        return '3550308';
      case 'cidade':
        return 'São Paulo, SP';
      default:
        return '';
    }
  };

  const getDefaultMessage = (restrictionType: string) => {
    switch (restrictionType) {
      case 'not_delivered':
        return 'Não fazemos entrega deste produto para esta região';
      case 'freight_on_demand':
        return 'Frete a combinar para esta região';
      case 'higher_fee':
        return 'Taxa de entrega diferenciada para esta região';
      default:
        return 'Frete a combinar para esta região';
    }
  };

  const handleRestrictionTypeChange = (type: string) => {
    setFormData({
      ...formData,
      restriction_type: type as any,
      restriction_message: getDefaultMessage(type)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Restrição de Produto</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product_id">Produto</Label>
            <Select 
              value={formData.product_id} 
              onValueChange={(value) => setFormData({ ...formData, product_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="zone_type">Tipo de Região</Label>
            <Select 
              value={formData.zone_type} 
              onValueChange={(value) => setFormData({ 
                ...formData, 
                zone_type: value as any,
                zone_value: ''
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cep_specific">CEP Específico</SelectItem>
                <SelectItem value="cep_range">Faixa de CEP</SelectItem>
                <SelectItem value="ibge">Código IBGE</SelectItem>
                <SelectItem value="cidade">Cidade</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="zone_value">Valor da Região</Label>
            <Input
              id="zone_value"
              placeholder={getPlaceholderByType()}
              value={formData.zone_value}
              onChange={(e) => setFormData({ ...formData, zone_value: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="restriction_type">Tipo de Restrição</Label>
            <Select 
              value={formData.restriction_type} 
              onValueChange={handleRestrictionTypeChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="freight_on_demand">Frete a Combinar</SelectItem>
                <SelectItem value="not_delivered">Não Entregamos</SelectItem>
                <SelectItem value="higher_fee">Taxa Maior</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="restriction_message">Mensagem para o Cliente</Label>
            <Textarea
              id="restriction_message"
              placeholder="Digite a mensagem que será exibida ao cliente"
              value={formData.restriction_message}
              onChange={(e) => setFormData({ ...formData, restriction_message: e.target.value })}
              required
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Restrição
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductRestrictionModal;
