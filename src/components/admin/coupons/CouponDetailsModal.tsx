
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import LoadingState from '@/components/common/LoadingState';
import { AdminCoupon } from '@/services/adminCouponsService';
import { useCouponUsage, CouponUsageDetail } from '@/hooks/admin/useCouponUsage';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Store, ShoppingBag, DollarSign, Tag } from 'lucide-react';

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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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
                <div><strong>Usos:</strong> {usageData.length}{coupon.max_uses ? `/${coupon.max_uses}` : ''}</div>
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
                  <div key={usage.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {/* Informações do usuário */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-gray-700 flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Cliente
                        </h4>
                        <div className="text-sm">
                          <div className="font-medium">{usage.user_name}</div>
                          <div className="text-gray-600">{usage.user_email}</div>
                          <div className="text-gray-500">
                            Usado em: {formatDate(usage.used_at)}
                          </div>
                        </div>
                      </div>

                      {/* Informações da loja/vendedor */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-gray-700 flex items-center gap-1">
                          <Store className="h-3 w-3" />
                          Loja/Vendedor
                        </h4>
                        <div className="text-sm">
                          <div className="font-medium text-blue-600">
                            {usage.store_name || usage.vendor_name || 'Loja não identificada'}
                          </div>
                          {usage.order_id && (
                            <div className="text-gray-500">
                              Pedido: {usage.order_id.substring(0, 8)}...
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Informações financeiras */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-gray-700 flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          Financeiro
                        </h4>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Valor da compra:</span>
                            <span className="font-medium">
                              {usage.order_total ? formatCurrency(usage.order_total) : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Desconto aplicado:</span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(usage.discount_amount)}
                            </span>
                          </div>
                          {usage.order_total && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">% de desconto:</span>
                              <span className="font-medium text-blue-600">
                                {((usage.discount_amount / usage.order_total) * 100).toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Lista de produtos (se disponível) */}
                    {usage.order_items && usage.order_items.length > 0 && (
                      <div className="border-t pt-3">
                        <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                          <ShoppingBag className="h-3 w-3" />
                          Produtos da compra ({usage.order_items.length})
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {usage.order_items.map((item) => (
                            <div key={item.id} className="text-xs bg-white p-2 rounded border">
                              <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">
                                    {item.produto?.nome || 'Produto não encontrado'}
                                  </div>
                                  <div className="text-gray-500">
                                    Qtd: {item.quantidade} x {formatCurrency(item.preco_unitario)}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">
                                    {formatCurrency(item.subtotal)}
                                  </div>
                                </div>
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
