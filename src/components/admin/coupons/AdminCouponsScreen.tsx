
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import AdminLayout from '../AdminLayout';
import CouponsTable from './CouponsTable';
import CouponForm from './CouponForm';
import LoadingState from '@/components/common/LoadingState';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  AdminCoupon, 
  CreateCouponData,
  fetchAdminCoupons, 
  createCoupon, 
  updateCoupon, 
  deleteCoupon, 
  toggleCouponStatus 
} from '@/services/adminCouponsService';

const AdminCouponsScreen: React.FC = () => {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [filteredCoupons, setFilteredCoupons] = useState<AdminCoupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<AdminCoupon | null>(null);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadCoupons();
  }, []);

  useEffect(() => {
    filterCoupons();
  }, [coupons, searchTerm]);

  const loadCoupons = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAdminCoupons();
      setCoupons(data);
    } catch (error) {
      console.error('Error loading coupons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterCoupons = () => {
    if (!searchTerm.trim()) {
      setFilteredCoupons(coupons);
      return;
    }

    const filtered = coupons.filter(coupon =>
      coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (coupon.description && coupon.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredCoupons(filtered);
  };

  const handleCreateCoupon = () => {
    setEditingCoupon(null);
    setIsFormOpen(true);
  };

  const handleEditCoupon = (coupon: AdminCoupon) => {
    setEditingCoupon(coupon);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: CreateCouponData) => {
    setIsFormLoading(true);
    try {
      let success = false;
      
      if (editingCoupon) {
        success = await updateCoupon(editingCoupon.id, data);
      } else {
        success = await createCoupon(data);
      }
      
      if (success) {
        setIsFormOpen(false);
        setEditingCoupon(null);
        await loadCoupons();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingCoupon(null);
  };

  const handleDeleteCoupon = (couponId: string) => {
    setCouponToDelete(couponId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!couponToDelete) return;
    
    const success = await deleteCoupon(couponToDelete);
    if (success) {
      await loadCoupons();
    }
    
    setDeleteDialogOpen(false);
    setCouponToDelete(null);
  };

  const handleToggleStatus = async (couponId: string, active: boolean) => {
    const success = await toggleCouponStatus(couponId, active);
    if (success) {
      await loadCoupons();
    }
  };

  if (isLoading) {
    return (
      <AdminLayout currentSection="cupons">
        <LoadingState text="Carregando cupons..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentSection="cupons">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciar Cupons</h1>
            <p className="text-gray-600">Crie e gerencie cupons de desconto</p>
          </div>
          <Button onClick={handleCreateCoupon} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Cupom
          </Button>
        </div>

        {/* Search */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar cupons por código, nome ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">{coupons.length}</div>
            <div className="text-sm text-gray-600">Total de Cupons</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">
              {coupons.filter(c => c.active).length}
            </div>
            <div className="text-sm text-gray-600">Ativos</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-red-600">
              {coupons.filter(c => !c.active).length}
            </div>
            <div className="text-sm text-gray-600">Inativos</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-orange-600">
              {coupons.reduce((sum, c) => sum + c.used_count, 0)}
            </div>
            <div className="text-sm text-gray-600">Total de Usos</div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border">
          <CouponsTable
            coupons={filteredCoupons}
            onEdit={handleEditCoupon}
            onDelete={handleDeleteCoupon}
            onToggleStatus={handleToggleStatus}
          />
        </div>

        {/* Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}
              </DialogTitle>
            </DialogHeader>
            <CouponForm
              coupon={editingCoupon || undefined}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              isLoading={isFormLoading}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este cupom? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminCouponsScreen;
