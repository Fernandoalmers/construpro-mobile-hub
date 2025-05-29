
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, ToggleLeft, ToggleRight, Package } from 'lucide-react';
import { AdminCoupon, getCouponStatusBadgeColor, getCouponStatusText } from '@/services/adminCouponsService';

interface CouponsTableProps {
  coupons: AdminCoupon[];
  onEdit: (coupon: AdminCoupon) => void;
  onDelete: (couponId: string) => void;
  onToggleStatus: (couponId: string, active: boolean) => void;
  isLoading?: boolean;
}

const CouponsTable: React.FC<CouponsTableProps> = ({
  coupons,
  onEdit,
  onDelete,
  onToggleStatus,
  isLoading = false
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDiscount = (type: string, value: number) => {
    if (type === 'percentage') {
      return `${value}%`;
    }
    return formatCurrency(value);
  };

  if (coupons.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhum cupom encontrado
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Desconto</TableHead>
            <TableHead>Min. Pedido</TableHead>
            <TableHead>Produtos</TableHead>
            <TableHead>Usos</TableHead>
            <TableHead>Validade</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {coupons.map((coupon) => (
            <TableRow key={coupon.id}>
              <TableCell className="font-mono font-medium">
                {coupon.code}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{coupon.name}</div>
                  {coupon.description && (
                    <div className="text-sm text-gray-500">{coupon.description}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {formatDiscount(coupon.discount_type, coupon.discount_value)}
              </TableCell>
              <TableCell>
                {formatCurrency(coupon.min_order_value)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Package className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    {coupon.specific_products && coupon.specific_products.length > 0
                      ? `${coupon.specific_products.length} específico(s)`
                      : 'Todos os produtos'
                    }
                  </span>
                </div>
                {coupon.specific_products && coupon.specific_products.length > 0 && (
                  <div className="mt-1">
                    {coupon.specific_products.slice(0, 2).map((sp) => (
                      <Badge key={sp.id} variant="outline" className="text-xs mr-1 mb-1">
                        {sp.produto?.nome || 'Produto removido'}
                      </Badge>
                    ))}
                    {coupon.specific_products.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{coupon.specific_products.length - 2} mais
                      </Badge>
                    )}
                  </div>
                )}
              </TableCell>
              <TableCell>
                {coupon.used_count}{coupon.max_uses ? `/${coupon.max_uses}` : ''}
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {coupon.starts_at && (
                    <div>De: {formatDate(coupon.starts_at)}</div>
                  )}
                  {coupon.expires_at && (
                    <div>Até: {formatDate(coupon.expires_at)}</div>
                  )}
                  {!coupon.starts_at && !coupon.expires_at && '-'}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getCouponStatusBadgeColor(coupon.active, coupon.expires_at)}>
                  {getCouponStatusText(coupon.active, coupon.expires_at)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleStatus(coupon.id, !coupon.active)}
                    disabled={isLoading}
                    title={coupon.active ? 'Desativar cupom' : 'Ativar cupom'}
                  >
                    {coupon.active ? (
                      <ToggleRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(coupon)}
                    disabled={isLoading}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(coupon.id)}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CouponsTable;
