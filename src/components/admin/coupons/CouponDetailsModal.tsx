
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import LoadingState from '@/components/common/LoadingState';
import { AdminCoupon } from '@/services/adminCouponsService';
import { useCouponUsage, CouponUsageDetail } from '@/hooks/admin/useCouponUsage';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface CouponDetailsModalProps {
  coupon: AdminCoupon | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CouponDetailsModal: React.FC<CouponDetailsModalProps> = ({
  coupon,
  open,
  onOpenChange
}) => {
  const { usageData, isLoading } = useCouponUsage(coupon?.id);

  if (!coupon) return null;

  const formatDiscount = (type: string, value: number) => {
    if (type === 'percentage') {
      return `${value}%`;
    }
    return formatCurrency(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detalhes do Cupom: {coupon.code}
            <Badge variant={coupon.active ? 'default' : 'secondary'}>
              {coupon.active ? 'Ativo' : 'Inativo'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações básicas do cupom */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Informações Básicas</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Nome:</strong> {coupon.name}</div>
                <div><strong>Descrição:</strong> {coupon.description || 'Sem descrição'}</div>
                <div><strong>Desconto:</strong> {formatDiscount(coupon.discount_type, coupon.discount_value)}</div>
                <div><strong>Valor mínimo:</strong> {formatCurrency(coupon.min_order_value)}</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Estatísticas</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Usos:</strong> {coupon.used_count}{coupon.max_uses ? `/${coupon.max_uses}` : ''}</div>
                <div><strong>Criado em:</strong> {formatDate(coupon.created_at)}</div>
                {coupon.starts_at && (
                  <div><strong>Início:</strong> {formatDate(coupon.starts_at)}</div>
                )}
                {coupon.expires_at && (
                  <div><strong>Expiração:</strong> {formatDate(coupon.expires_at)}</div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Histórico de uso */}
          <div>
            <h3 className="font-semibold mb-4">
              Histórico de Uso ({usageData.length})
            </h3>
            
            {isLoading ? (
              <LoadingState text="Carregando histórico de uso..." />
            ) : usageData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Este cupom ainda não foi utilizado
              </div>
            ) : (
              <div className="space-y-4">
                {usageData.map((usage) => (
                  <div key={usage.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-medium">{usage.user_name}</div>
                        <div className="text-sm text-gray-600">{usage.user_email}</div>
                        <div className="text-sm text-gray-500">
                          Usado em: {formatDate(usage.used_at)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-green-600">
                          Desconto: {formatCurrency(usage.discount_amount)}
                        </div>
                        {usage.order_id && (
                          <div className="text-sm text-gray-500">
                            Pedido: {usage.order_id.substring(0, 8)}...
                          </div>
                        )}
                      </div>
                    </div>

                    {usage.order_items && usage.order_items.length > 0 && (
                      <div>
                        <div className="text-sm font-medium mb-2">Produtos comprados:</div>
                        <div className="space-y-2">
                          {usage.order_items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                              <div className="flex-1">
                                <div className="font-medium">{item.produto?.nome || 'Produto não encontrado'}</div>
                                <div className="text-gray-600">
                                  Loja: {item.produto?.vendedores?.nome_loja || 'Loja não encontrada'}
                                </div>
                              </div>
                              <div className="text-right">
                                <div>Qtd: {item.quantidade}</div>
                                <div>{formatCurrency(item.subtotal)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CouponDetailsModal;
