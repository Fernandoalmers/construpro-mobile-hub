
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminCoupon, CreateCouponData, createCoupon, updateCoupon } from '@/services/adminCouponsService';
import { toast } from '@/components/ui/sonner';
import ProductSelector from './ProductSelector';

interface CouponFormProps {
  coupon?: AdminCoupon | null;
  onClose: () => void;
  isLoading?: boolean;
}

const CouponForm: React.FC<CouponFormProps> = ({
  coupon,
  onClose,
  isLoading: externalLoading = false
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
    active: coupon?.active ?? true,
    product_ids: coupon?.specific_products?.map(sp => sp.product_id) || []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Código é obrigatório';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (formData.discount_value <= 0) {
      newErrors.discount_value = 'Valor do desconto deve ser maior que zero';
    }

    if (formData.discount_type === 'percentage' && formData.discount_value > 100) {
      newErrors.discount_value = 'Porcentagem não pode ser maior que 100%';
    }

    if (formData.min_order_value < 0) {
      newErrors.min_order_value = 'Valor mínimo não pode ser negativo';
    }

    if (formData.max_uses && formData.max_uses <= 0) {
      newErrors.max_uses = 'Limite de uso deve ser maior que zero';
    }

    if (formData.expires_at && formData.starts_at && new Date(formData.expires_at) <= new Date(formData.starts_at)) {
      newErrors.expires_at = 'Data de expiração deve ser posterior à data de início';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const submitData = {
        ...formData,
        starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : undefined,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : undefined,
        max_uses: formData.max_uses || undefined
      };
      
      let success = false;
      
      if (coupon) {
        // Editando cupom existente
        success = await updateCoupon(coupon.id, submitData);
      } else {
        // Criando novo cupom
        success = await createCoupon(submitData);
      }
      
      if (success) {
        toast.success(coupon ? 'Cupom atualizado com sucesso!' : 'Cupom criado com sucesso!');
        onClose();
      }
    } catch (error) {
      console.error('Error submitting coupon:', error);
      toast.error('Erro ao salvar cupom. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof CreateCouponData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const isLoading = externalLoading || isSubmitting;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
                  className={errors.code ? 'border-red-500' : ''}
                />
                {errors.code && <p className="text-sm text-red-500">{errors.code}</p>}
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
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
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
                  className={errors.discount_value ? 'border-red-500' : ''}
                />
                {errors.discount_value && <p className="text-sm text-red-500">{errors.discount_value}</p>}
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
                  className={errors.min_order_value ? 'border-red-500' : ''}
                />
                {errors.min_order_value && <p className="text-sm text-red-500">{errors.min_order_value}</p>}
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
                  className={errors.max_uses ? 'border-red-500' : ''}
                />
                {errors.max_uses && <p className="text-sm text-red-500">{errors.max_uses}</p>}
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
                  className={errors.expires_at ? 'border-red-500' : ''}
                />
                {errors.expires_at && <p className="text-sm text-red-500">{errors.expires_at}</p>}
              </div>
            </div>

            {/* Seletor de produtos específicos */}
            <ProductSelector
              selectedProductIds={formData.product_ids || []}
              onProductsChange={(productIds) => handleChange('product_ids', productIds)}
              disabled={isLoading}
            />

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
              <Button 
                type="submit" 
                disabled={isLoading}
                className="min-w-[120px]"
              >
                {isSubmitting ? 'Salvando...' : (coupon ? 'Atualizar' : 'Criar')} Cupom
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CouponForm;
