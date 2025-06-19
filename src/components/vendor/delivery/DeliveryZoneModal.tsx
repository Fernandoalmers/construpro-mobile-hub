
import React, { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { Loader2 } from 'lucide-react';
import {
  createVendorDeliveryZone,
  updateVendorDeliveryZone,
  VendorDeliveryZone
} from '@/services/vendor/deliveryZones';
import { useCepLookup } from '@/hooks/useCepLookup';

interface DeliveryZoneModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  vendorId: string;
  editingZone?: VendorDeliveryZone | null;
}

const DeliveryZoneModal: React.FC<DeliveryZoneModalProps> = ({
  open,
  onOpenChange,
  onClose,
  vendorId,
  editingZone
}) => {
  const { lookupAddress } = useCepLookup();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    zone_name: '',
    zone_type: 'cep_specific' as 'cep_specific' | 'cep_range' | 'ibge' | 'cidade',
    zone_value: '',
    delivery_time: 'até 7 dias úteis',
    delivery_fee: 0
  });

  useEffect(() => {
    if (editingZone) {
      setFormData({
        zone_name: editingZone.zone_name,
        zone_type: editingZone.zone_type,
        zone_value: editingZone.zone_value,
        delivery_time: editingZone.delivery_time,
        delivery_fee: editingZone.delivery_fee
      });
    } else {
      setFormData({
        zone_name: '',
        zone_type: 'cep_specific',
        zone_value: '',
        delivery_time: 'até 7 dias úteis',
        delivery_fee: 0
      });
    }
  }, [editingZone, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.zone_name.trim() || !formData.zone_value.trim()) {
      toast.error('Nome da zona e valor são obrigatórios');
      return;
    }

    // Validate zone value based on type
    if (formData.zone_type === 'cep_specific') {
      const cleanCep = formData.zone_value.replace(/\D/g, '');
      if (cleanCep.length !== 8) {
        toast.error('CEP deve ter 8 dígitos');
        return;
      }
      
      // Validate CEP exists
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
      
      const zoneData = {
        vendor_id: vendorId,
        ...formData
      };

      if (editingZone) {
        await updateVendorDeliveryZone(editingZone.id, zoneData);
        toast.success('Zona de entrega atualizada');
      } else {
        await createVendorDeliveryZone(zoneData);
        toast.success('Zona de entrega criada');
      }

      onClose();
    } catch (error) {
      console.error('Error saving delivery zone:', error);
      toast.error('Erro ao salvar zona de entrega');
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

  const getHelpText = () => {
    switch (formData.zone_type) {
      case 'cep_specific':
        return 'Digite um CEP específico que você atende';
      case 'cep_range':
        return 'Digite uma faixa de CEPs no formato: início-fim';
      case 'ibge':
        return 'Digite o código IBGE da cidade';
      case 'cidade':
        return 'Digite o nome da cidade e estado';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingZone ? 'Editar Zona de Entrega' : 'Nova Zona de Entrega'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="zone_name">Nome da Zona</Label>
            <Input
              id="zone_name"
              placeholder="Ex: Centro de São Paulo"
              value={formData.zone_name}
              onChange={(e) => setFormData({ ...formData, zone_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zone_type">Tipo de Zona</Label>
            <Select 
              value={formData.zone_type} 
              onValueChange={(value) => setFormData({ 
                ...formData, 
                zone_type: value as any,
                zone_value: '' // Reset value when type changes
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
            <Label htmlFor="zone_value">Valor da Zona</Label>
            <Input
              id="zone_value"
              placeholder={getPlaceholderByType()}
              value={formData.zone_value}
              onChange={(e) => setFormData({ ...formData, zone_value: e.target.value })}
              required
            />
            <p className="text-xs text-gray-500">{getHelpText()}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery_time">Prazo de Entrega</Label>
            <Input
              id="delivery_time"
              placeholder="Ex: até 3 dias úteis"
              value={formData.delivery_time}
              onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery_fee">Taxa de Entrega (R$)</Label>
            <Input
              id="delivery_fee"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.delivery_fee}
              onChange={(e) => setFormData({ ...formData, delivery_fee: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingZone ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DeliveryZoneModal;
