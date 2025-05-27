
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Search, Calendar, Percent, DollarSign } from 'lucide-react';
import AdminLayout from '../AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { couponsService, Coupon } from '@/services/couponsService';
import CouponFormModal from './CouponFormModal';

const AdminCouponsScreen: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const queryClient = useQueryClient();

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: couponsService.getAllCoupons
  });

  const deleteMutation = useMutation({
    mutationFn: couponsService.deleteCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Cupom excluído com sucesso');
    },
    onError: () => {
      toast.error('Erro ao excluir cupom');
    }
  });

  const filteredCoupons = coupons.filter(coupon =>
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cupom?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCoupon(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Não definido';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDiscount = (type: string, value: number) => {
    return type === 'percentage' ? `${value}%` : `R$ ${value.toFixed(2)}`;
  };

  return (
    <AdminLayout currentSection="cupons">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciar Cupons</h1>
            <p className="text-gray-600">Crie e gerencie cupons de desconto</p>
          </div>
          <Button onClick={() => setIsFormOpen(true)} className="bg-construPro-blue">
            <Plus size={20} className="mr-2" />
            Novo Cupom
          </Button>
        </div>

        {/* Search */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Buscar cupons por código ou nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Coupons List */}
        <div className="grid gap-4">
          {isLoading ? (
            <div className="text-center py-8">Carregando cupons...</div>
          ) : filteredCoupons.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">Nenhum cupom encontrado</p>
            </Card>
          ) : (
            filteredCoupons.map((coupon) => (
              <Card key={coupon.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{coupon.code}</h3>
                      <Badge variant={coupon.active ? 'default' : 'secondary'}>
                        {coupon.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {coupon.discount_type === 'percentage' ? <Percent size={12} /> : <DollarSign size={12} />}
                        {formatDiscount(coupon.discount_type, coupon.discount_value)}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-2">{coupon.name}</p>
                    {coupon.description && (
                      <p className="text-sm text-gray-500 mb-2">{coupon.description}</p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Valor mínimo:</span>
                        <p>R$ {coupon.min_order_value.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="font-medium">Usos:</span>
                        <p>{coupon.used_count} / {coupon.max_uses || '∞'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Início:</span>
                        <p>{formatDate(coupon.starts_at)}</p>
                      </div>
                      <div>
                        <span className="font-medium">Expiração:</span>
                        <p>{formatDate(coupon.expires_at)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(coupon)}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(coupon.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Form Modal */}
      <CouponFormModal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        coupon={editingCoupon}
      />
    </AdminLayout>
  );
};

export default AdminCouponsScreen;
