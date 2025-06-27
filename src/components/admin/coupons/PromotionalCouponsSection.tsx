
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Ticket,
  Calendar,
  Users,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import LoadingState from '@/components/common/LoadingState';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  fetchAllPromotionalCoupons,
  fetchAdminCoupons,
  createPromotionalCoupon,
  togglePromotionalCouponStatus,
  deletePromotionalCoupon,
  reorderPromotionalCoupons,
  PromotionalCoupon,
  formatDiscount,
  formatExpiryDate,
  getCouponStatusColor,
  getCouponStatusText
} from '@/services/promotionalCouponsService';

interface AdminCoupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value: number;
  max_uses?: number;
  used_count: number;
  starts_at?: string;
  expires_at?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

const PromotionalCouponsSection: React.FC = () => {
  const [promotionalCoupons, setPromotionalCoupons] = useState<PromotionalCoupon[]>([]);
  const [availableCoupons, setAvailableCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [promotionalData, couponsData] = await Promise.all([
        fetchAllPromotionalCoupons(),
        fetchAdminCoupons()
      ]);
      
      setPromotionalCoupons(promotionalData);
      
      // Filtrar cupons que ainda não são promocionais
      const promotionalCouponIds = promotionalData.map(pc => pc.coupon_id);
      const available = couponsData.filter((coupon: AdminCoupon) => 
        !promotionalCouponIds.includes(coupon.id) && coupon.active
      );
      
      setAvailableCoupons(available);
    } catch (error) {
      console.error('Error loading promotional coupons:', error);
      toast.error('Erro ao carregar cupons promocionais');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPromotionalCoupon = async (couponId: string) => {
    try {
      setActionLoading(couponId);
      
      const nextOrder = Math.max(...promotionalCoupons.map(pc => pc.display_order), -1) + 1;
      
      const success = await createPromotionalCoupon({
        coupon_id: couponId,
        featured: true,
        display_order: nextOrder
      });
      
      if (success) {
        await loadData();
        setShowAddDialog(false);
      }
    } catch (error) {
      console.error('Error adding promotional coupon:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (id: string, featured: boolean) => {
    try {
      setActionLoading(id);
      
      const success = await togglePromotionalCouponStatus(id, featured);
      
      if (success) {
        setPromotionalCoupons(prev => 
          prev.map(pc => 
            pc.id === id ? { ...pc, featured } : pc
          )
        );
      }
    } catch (error) {
      console.error('Error toggling promotional coupon status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setActionLoading(id);
      
      const success = await deletePromotionalCoupon(id);
      
      if (success) {
        await loadData();
      }
    } catch (error) {
      console.error('Error deleting promotional coupon:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    try {
      setActionLoading(id);
      
      const currentIndex = promotionalCoupons.findIndex(pc => pc.id === id);
      if (currentIndex === -1) return;
      
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= promotionalCoupons.length) return;
      
      const reorderedCoupons = [...promotionalCoupons];
      [reorderedCoupons[currentIndex], reorderedCoupons[newIndex]] = 
      [reorderedCoupons[newIndex], reorderedCoupons[currentIndex]];
      
      // Atualizar os display_order
      const updates = reorderedCoupons.map((pc, index) => ({
        id: pc.id,
        display_order: index
      }));
      
      const success = await reorderPromotionalCoupons(updates);
      
      if (success) {
        setPromotionalCoupons(reorderedCoupons.map((pc, index) => ({
          ...pc,
          display_order: index
        })));
      }
    } catch (error) {
      console.error('Error reordering promotional coupons:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <LoadingState text="Carregando cupons promocionais..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Cupons Promocionais</h3>
          <p className="text-sm text-gray-600">
            Gerencie quais cupons aparecerão na página "Meus Cupons" dos usuários
          </p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Cupom Promocional
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adicionar Cupom Promocional</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {availableCoupons.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Nenhum cupom disponível para adicionar como promocional
                  </p>
                </div>
              ) : (
                availableCoupons.map((coupon) => (
                  <Card key={coupon.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{coupon.name}</h4>
                          <Badge className={getCouponStatusColor(coupon.active, coupon.expires_at)}>
                            {getCouponStatusText(coupon.active, coupon.expires_at)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          Código: <span className="font-mono">{coupon.code}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Desconto: {formatDiscount(coupon.discount_type, coupon.discount_value)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatExpiryDate(coupon.expires_at)}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleAddPromotionalCoupon(coupon.id)}
                        disabled={actionLoading === coupon.id}
                        size="sm"
                      >
                        {actionLoading === coupon.id ? 'Adicionando...' : 'Adicionar'}
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Ticket className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{promotionalCoupons.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Ativos</p>
                <p className="text-2xl font-bold">
                  {promotionalCoupons.filter(pc => pc.featured).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <EyeOff className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Inativos</p>
                <p className="text-2xl font-bold">
                  {promotionalCoupons.filter(pc => !pc.featured).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Disponíveis</p>
                <p className="text-2xl font-bold">{availableCoupons.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Promotional Coupons List */}
      <Card>
        <CardHeader>
          <CardTitle>Cupons Promocionais Configurados</CardTitle>
        </CardHeader>
        <CardContent>
          {promotionalCoupons.length === 0 ? (
            <div className="text-center py-8">
              <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                Nenhum cupom promocional configurado
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {promotionalCoupons.map((promotionalCoupon, index) => {
                const { coupon } = promotionalCoupon;
                const isLoading = actionLoading === promotionalCoupon.id;
                
                return (
                  <div
                    key={promotionalCoupon.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col space-y-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReorder(promotionalCoupon.id, 'up')}
                          disabled={index === 0 || isLoading}
                          className="h-6 w-6 p-0"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReorder(promotionalCoupon.id, 'down')}
                          disabled={index === promotionalCoupons.length - 1 || isLoading}
                          className="h-6 w-6 p-0"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{coupon.name}</h4>
                          <Badge className={getCouponStatusColor(coupon.active, coupon.expires_at)}>
                            {getCouponStatusText(coupon.active, coupon.expires_at)}
                          </Badge>
                          {promotionalCoupon.featured && (
                            <Badge variant="secondary">Visível</Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>Código: <span className="font-mono">{coupon.code}</span></span>
                          <span>Desconto: {formatDiscount(coupon.discount_type, coupon.discount_value)}</span>
                          <span>{formatExpiryDate(coupon.expires_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Visível:</span>
                        <Switch
                          checked={promotionalCoupon.featured}
                          onCheckedChange={(checked) => handleToggleStatus(promotionalCoupon.id, checked)}
                          disabled={isLoading}
                        />
                      </div>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover Cupom Promocional</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover este cupom da lista promocional?
                              O cupom em si não será excluído, apenas não aparecerá mais na página "Meus Cupons" dos usuários.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(promotionalCoupon.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PromotionalCouponsSection;
