
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Ticket, Tag, TrendingUp } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import LoadingState from '@/components/common/LoadingState';
import CouponsTable from './CouponsTable';
import CouponForm from './CouponForm';
import PromotionalCouponsSection from './PromotionalCouponsSection';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { fetchAdminCoupons, AdminCoupon, deleteCoupon, toggleCouponStatus, createCoupon, updateCoupon, CreateCouponData } from '@/services/adminCouponsService';
import { toast } from '@/components/ui/sonner';

const AdminCouponsScreen: React.FC = () => {
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<AdminCoupon | null>(null);

  useEffect(() => {
    if (isAdmin) {
      loadCoupons();
    }
  }, [isAdmin]);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminCoupons();
      setCoupons(data);
    } catch (error) {
      console.error('Error loading coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = () => {
    setEditingCoupon(null);
    setShowForm(true);
  };

  const handleEditCoupon = (coupon: AdminCoupon) => {
    setEditingCoupon(coupon);
    setShowForm(true);
  };

  const handleDeleteCoupon = async (couponId: string) => {
    try {
      const success = await deleteCoupon(couponId);
      if (success) {
        await loadCoupons();
        toast.success('Cupom excluído com sucesso');
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Erro ao excluir cupom');
    }
  };

  const handleToggleStatus = async (couponId: string, active: boolean) => {
    try {
      const success = await toggleCouponStatus(couponId, active);
      if (success) {
        await loadCoupons();
        toast.success(`Cupom ${active ? 'ativado' : 'desativado'} com sucesso`);
      }
    } catch (error) {
      console.error('Error toggling coupon status:', error);
      toast.error('Erro ao alterar status do cupom');
    }
  };

  const handleFormSubmit = async (data: CreateCouponData) => {
    try {
      let success;
      if (editingCoupon) {
        success = await updateCoupon(editingCoupon.id, data);
        toast.success('Cupom atualizado com sucesso');
      } else {
        success = await createCoupon(data);
        toast.success('Cupom criado com sucesso');
      }
      
      if (success) {
        setShowForm(false);
        setEditingCoupon(null);
        await loadCoupons();
      }
    } catch (error) {
      console.error('Error saving coupon:', error);
      toast.error('Erro ao salvar cupom');
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCoupon(null);
  };

  if (adminLoading) {
    return <LoadingState text="Verificando permissões..." />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  const activeCount = coupons.filter(c => c.active).length;
  const expiredCount = coupons.filter(c => c.expires_at && new Date(c.expires_at) < new Date()).length;

  return (
    <AdminLayout currentSection="cupons">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciar Cupons</h1>
            <p className="text-gray-600">Gerencie cupons de desconto e cupons promocionais</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Ticket className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Cupons</p>
                  <p className="text-2xl font-bold">{coupons.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Tag className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Cupons Ativos</p>
                  <p className="text-2xl font-bold">{activeCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Cupons Expirados</p>
                  <p className="text-2xl font-bold">{expiredCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Ticket className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Usos</p>
                  <p className="text-2xl font-bold">
                    {coupons.reduce((sum, coupon) => sum + coupon.used_count, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="coupons" className="space-y-4">
          <TabsList>
            <TabsTrigger value="coupons">Cupons de Desconto</TabsTrigger>
            <TabsTrigger value="promotional">Cupons Promocionais</TabsTrigger>
          </TabsList>
          
          <TabsContent value="coupons" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Cupons de Desconto</h2>
              <Button onClick={handleCreateCoupon}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Cupom
              </Button>
            </div>
            
            {loading ? (
              <LoadingState text="Carregando cupons..." />
            ) : (
              <CouponsTable 
                coupons={coupons} 
                onEdit={handleEditCoupon}
                onDelete={handleDeleteCoupon}
                onToggleStatus={handleToggleStatus}
              />
            )}
          </TabsContent>
          
          <TabsContent value="promotional" className="space-y-4">
            <PromotionalCouponsSection />
          </TabsContent>
        </Tabs>

        {/* Coupon Form Modal */}
        {showForm && (
          <CouponForm
            coupon={editingCoupon}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCouponsScreen;
