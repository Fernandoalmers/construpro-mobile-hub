
import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/sonner';
import { couponsService, Coupon } from '@/services/couponsService';

interface CouponFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupon?: Coupon | null;
}

const CouponFormModal: React.FC<CouponFormModalProps> = ({ isOpen, onClose, coupon }) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 0,
    min_order_value: 0,
    max_uses: '',
    starts_at: '',
    expires_at: '',
    active: true
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (coupon) {
      setFormData({
        code: coupon.code,
        name: coupon.name,
        description: coupon.description || '',
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        min_order_value: coupon.min_order_value,
        max_uses: coupon.max_uses?.toString() || '',
        starts_at: coupon.starts_at ? new Date(coupon.starts_at).toISOString().slice(0, 16) : '',
        expires_at: coupon.expires_at ? new Date(coupon.expires_at).toISOString().slice(0, 16) : '',
        active: coupon.active
      });
    } else {
      setFormData({
        code: '',
        name: '',
        description: '',
        discount_type: 'percentage',
        discount_value: 0,
        min_order_value: 0,
        max_uses: '',
        starts_at: '',
        expires_at: '',
        active: true
      });
    }
  }, [coupon]);

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        code: data.code.toUpperCase(),
        max_uses: data.max_uses ? parseInt(data.max_uses) : null,
        starts_at: data.starts_at ? new Date(data.starts_at).toISOString() : null,
        expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : null
      };

      if (coupon) {
        return couponsService.updateCoupon(coupon.id, payload);
      } else {
        return couponsService.createCoupon(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success(coupon ? 'Cupom atualizado com sucesso' : 'Cupom criado com sucesso');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao salvar cupom');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.name || formData.discount_value <= 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    mutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {coupon ? 'Editar Cupom' : 'Novo Cupom'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">Código do Cupom *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                placeholder="EX: BEMVINDO10"
                required
              />
            </div>
            <div>
              <Label htmlFor="name">Nome do Cupom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Cupom de Boas-vindas"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Descrição do cupom..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discount_type">Tipo de Desconto *</Label>
              <Select 
                value={formData.discount_type} 
                onValueChange={(value: 'percentage' | 'fixed') => setFormData({...formData, discount_type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                  <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="discount_value">
                Valor do Desconto * {formData.discount_type === 'percentage' ? '(%)' : '(R$)'}
              </Label>
              <Input
                id="discount_value"
                type="number"
                min="0"
                step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                value={formData.discount_value}
                onChange={(e) => setFormData({...formData, discount_value: parseFloat(e.target.value) || 0})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min_order_value">Valor Mínimo do Pedido (R$)</Label>
              <Input
                id="min_order_value"
                type="number"
                min="0"
                step="0.01"
                value={formData.min_order_value}
                onChange={(e) => setFormData({...formData, min_order_value: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div>
              <Label htmlFor="max_uses">Limite de Usos</Label>
              <Input
                id="max_uses"
                type="number"
                min="1"
                value={formData.max_uses}
                onChange={(e) => setFormData({...formData, max_uses: e.target.value})}
                placeholder="Deixe vazio para ilimitado"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="starts_at">Data de Início</Label>
              <Input
                id="starts_at"
                type="datetime-local"
                value={formData.starts_at}
                onChange={(e) => setFormData({...formData, starts_at: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="expires_at">Data de Expiração</Label>
              <Input
                id="expires_at"
                type="datetime-local"
                value={formData.expires_at}
                onChange={(e) => setFormData({...formData, expires_at: e.target.value})}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({...formData, active: checked})}
            />
            <Label htmlFor="active">Cupom Ativo</Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending} className="flex-1">
              {mutation.isPending ? 'Salvando...' : (coupon ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CouponFormModal;
