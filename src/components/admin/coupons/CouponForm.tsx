
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminCoupon, CreateCouponData } from '@/services/adminCouponsService';

interface CouponFormProps {
  coupon?: AdminCoupon;
  onSubmit: (data: CreateCouponData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const CouponForm: React.FC<CouponFormProps> = ({
  coupon,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<CreateCouponData>({
    code: coupon?.code || '',
    name: coupon?.name || '',
    description: coupon?.description || '',
    discount_type: coupon?.discount_type || 'percentage',
    discount_value: coupon?.discount_value || 0,
    min_order_value: coupon?.min_order_value || 0,
    max_uses: coupon?.max_uses || undefined,
    starts_at: coupon?.starts_at ? new Date(coupon.starts_at).toISOString().slice(0, 16) : '',
    expires_at: coupon?.expires_at ? new Date(coupon.expires_at).toISOString().slice(0, 16) : '',
    active: coupon?.active ?? true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : undefined,
      expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : undefined,
      max_uses: formData.max_uses || undefined
    };
    
    await onSubmit(submitData);
  };

  const handleChange = (field: keyof CreateCouponData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {coupon ? 'Editar Cupom' : 'Novo Cupom'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código do Cupom *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                placeholder="EX: DESCONTO10"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Cupom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Nome descritivo"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Descrição do cupom"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discount_type">Tipo de Desconto *</Label>
              <Select
                value={formData.discount_type}
                onValueChange={(value) => handleChange('discount_type', value)}
                disabled={isLoading}
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
            
            <div className="space-y-2">
              <Label htmlFor="discount_value">
                Valor do Desconto * {formData.discount_type === 'percentage' ? '(%)' : '(R$)'}
              </Label>
              <Input
                id="discount_value"
                type="number"
                step={formData.discount_type === 'percentage' ? '0.1' : '0.01'}
                min="0"
                max={formData.discount_type === 'percentage' ? '100' : undefined}
                value={formData.discount_value}
                onChange={(e) => handleChange('discount_value', parseFloat(e.target.value) || 0)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_order_value">Valor Mínimo do Pedido (R$)</Label>
              <Input
                id="min_order_value"
                type="number"
                step="0.01"
                min="0"
                value={formData.min_order_value}
                onChange={(e) => handleChange('min_order_value', parseFloat(e.target.value) || 0)}
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="max_uses">Limite de Uso (deixe vazio para ilimitado)</Label>
              <Input
                id="max_uses"
                type="number"
                min="1"
                value={formData.max_uses || ''}
                onChange={(e) => handleChange('max_uses', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Ilimitado"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="starts_at">Data de Início</Label>
              <Input
                id="starts_at"
                type="datetime-local"
                value={formData.starts_at}
                onChange={(e) => handleChange('starts_at', e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="expires_at">Data de Expiração</Label>
              <Input
                id="expires_at"
                type="datetime-local"
                value={formData.expires_at}
                onChange={(e) => handleChange('expires_at', e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => handleChange('active', checked)}
              disabled={isLoading}
            />
            <Label htmlFor="active">Cupom Ativo</Label>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : (coupon ? 'Atualizar' : 'Criar')} Cupom
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CouponForm;
