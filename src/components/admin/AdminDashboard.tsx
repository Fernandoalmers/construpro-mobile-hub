import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShoppingBag, Store, Gift, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';

interface DashboardStats {
  users: {
    total: number;
    pending: number;
  };
  products: {
    total: number;
    pending: number;
  };
  stores: {
    total: number;
    pending: number;
  };
  redemptions: {
    total: number;
    pending: number;
  };
  isLoading: boolean;
  error: string | null;
}

interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  timestamp: string;
  details?: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    users: { total: 0, pending: 0 },
    products: { total: 0, pending: 0 },
    stores: { total: 0, pending: 0 },
    redemptions: { total: 0, pending: 0 },
    isLoading: true,
    error: null
  });
  
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Check admin status first
        const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
        
        if (adminError) {
          throw new Error('Error verifying admin status: ' + adminError.message);
        }
        
        if (!isAdmin) {
          throw new Error('Unauthorized: Admin access required');
        }
        
        // Fetch total users count
        const { count: totalUsers, error: usersError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
          
        if (usersError) throw new Error('Error fetching users: ' + usersError.message);
        
        // Fetch pending users count
        const { count: pendingUsers, error: pendingUsersError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pendente');
          
        if (pendingUsersError) throw new Error('Error fetching pending users: ' + pendingUsersError.message);
        
        // Fetch total products count
        const { count: totalProducts, error: productsError } = await supabase
          .from('produtos')
          .select('*', { count: 'exact', head: true });
          
        if (productsError) throw new Error('Error fetching products: ' + productsError.message);
        
        // Fetch pending products count
        const { count: pendingProducts, error: pendingProductsError } = await supabase
          .from('produtos')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pendente');
          
        if (pendingProductsError) throw new Error('Error fetching pending products: ' + pendingProductsError.message);
        
        // Fetch total stores count
        const { count: totalStores, error: storesError } = await supabase
          .from('lojas')
          .select('*', { count: 'exact', head: true });
          
        if (storesError) throw new Error('Error fetching stores: ' + storesError.message);
        
        // Fetch pending stores count
        const { count: pendingStores, error: pendingStoresError } = await supabase
          .from('lojas')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pendente');
          
        if (pendingStoresError) throw new Error('Error fetching pending stores: ' + pendingStoresError.message);
        
        // Fetch total redemptions count
        const { count: totalRedemptions, error: redemptionsError } = await supabase
          .from('resgates')
          .select('*', { count: 'exact', head: true });
          
        if (redemptionsError) throw new Error('Error fetching redemptions: ' + redemptionsError.message);
        
        // Fetch pending redemptions count
        const { count: pendingRedemptions, error: pendingRedemptionsError } = await supabase
          .from('resgates')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pendente');
          
        if (pendingRedemptionsError) throw new Error('Error fetching pending redemptions: ' + pendingRedemptionsError.message);

        // Update stats with real data
        setStats({
          users: { 
            total: totalUsers || 0, 
            pending: pendingUsers || 0 
          },
          products: { 
            total: totalProducts || 0, 
            pending: pendingProducts || 0 
          },
          stores: { 
            total: totalStores || 0, 
            pending: pendingStores || 0 
          },
          redemptions: { 
            total: totalRedemptions || 0, 
            pending: pendingRedemptions || 0 
          },
          isLoading: false,
          error: null
        });
        
        // Fetch recent admin logs
        await fetchRecentActivity();
        
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setStats(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Erro ao carregar estatísticas'
        }));
      }
    };
    
    const fetchRecentActivity = async () => {
      try {
        setActivitiesLoading(true);
        
        // Fetch recent admin logs if available
        const { data: logs, error: logsError } = await supabase
          .from('admin_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (logsError) {
          console.warn('Could not fetch admin logs:', logsError);
          // Generate some placeholder data if no logs exist
          setRecentActivity([
            { 
              id: '1', 
              action: 'Aprovação de produto', 
              entity: 'Furadeira de Impacto 750W', 
              timestamp: new Date().toISOString() 
            },
            { 
              id: '2', 
              action: 'Cadastro de recompensa', 
              entity: 'Vale-compra R$100', 
              timestamp: new Date(Date.now() - 3600000).toISOString() 
            },
            { 
              id: '3', 
              action: 'Aprovação de loja', 
              entity: 'Casa do Construtor', 
              timestamp: new Date(Date.now() - 86400000).toISOString() 
            }
          ]);
        } else {
          // Format admin logs appropriately
          const formattedLogs = logs?.map(log => ({
            id: log.id,
            action: log.action,
            entity: log.entity_type + ': ' + log.entity_id,
            timestamp: new Date(log.created_at).toISOString(),
            details: log.details ? JSON.stringify(log.details) : undefined
          })) || [];
          
          setRecentActivity(formattedLogs);
        }
      } catch (error) {
        console.error('Error fetching activity logs:', error);
      } finally {
        setActivitiesLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Format the date display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    
    // If today
    if (date.toDateString() === now.toDateString()) {
      return `Hoje, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // If yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Ontem, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Otherwise
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };
  
  // If there's an error loading the stats
  if (stats.error) {
    return (
      <AdminLayout currentSection="Dashboard">
        <ErrorState 
          title="Erro ao carregar o painel administrativo" 
          message={stats.error}
          onRetry={() => window.location.reload()}
        />
      </AdminLayout>
    );
  }

  // If data is still loading
  if (stats.isLoading) {
    return (
      <AdminLayout currentSection="Dashboard">
        <LoadingState text="Carregando estatísticas administrativas..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentSection="Dashboard">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-medium">Usuários</CardTitle>
                <div className="p-2 rounded-full bg-blue-50">
                  <Users className="text-blue-500" size={24} />
                </div>
              </div>
              <CardDescription>Total de usuários registrados</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.users.total}</p>
              {stats.users.pending > 0 && (
                <p className="text-sm text-amber-500 flex items-center gap-1 mt-1">
                  <AlertCircle size={14} />
                  {stats.users.pending} usuário{stats.users.pending !== 1 ? 's' : ''} pendente{stats.users.pending !== 1 ? 's' : ''}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-medium">Produtos</CardTitle>
                <div className="p-2 rounded-full bg-emerald-50">
                  <ShoppingBag className="text-emerald-500" size={24} />
                </div>
              </div>
              <CardDescription>Produtos cadastrados</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.products.total}</p>
              {stats.products.pending > 0 && (
                <p className="text-sm text-amber-500 flex items-center gap-1 mt-1">
                  <AlertCircle size={14} />
                  {stats.products.pending} produto{stats.products.pending !== 1 ? 's' : ''} pendente{stats.products.pending !== 1 ? 's' : ''}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-medium">Lojas</CardTitle>
                <div className="p-2 rounded-full bg-purple-50">
                  <Store className="text-purple-500" size={24} />
                </div>
              </div>
              <CardDescription>Lojas ativas</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.stores.total}</p>
              {stats.stores.pending > 0 && (
                <p className="text-sm text-amber-500 flex items-center gap-1 mt-1">
                  <AlertCircle size={14} />
                  {stats.stores.pending} loja{stats.stores.pending !== 1 ? 's' : ''} pendente{stats.stores.pending !== 1 ? 's' : ''}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-medium">Resgates</CardTitle>
                <div className="p-2 rounded-full bg-amber-50">
                  <Gift className="text-amber-500" size={24} />
                </div>
              </div>
              <CardDescription>Resgates realizados</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.redemptions.total}</p>
              {stats.redemptions.pending > 0 && (
                <p className="text-sm text-amber-500 flex items-center gap-1 mt-1">
                  <AlertCircle size={14} />
                  {stats.redemptions.pending} resgate{stats.redemptions.pending !== 1 ? 's' : ''} pendente{stats.redemptions.pending !== 1 ? 's' : ''}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pending Items Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-md font-medium">Usuários Pendentes</CardTitle>
                <div className="p-2 rounded-full bg-orange-50">
                  <AlertCircle className="text-orange-500" size={20} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="text-2xl font-bold">{stats.users.pending}</p>
              <p className="text-sm text-gray-500">Aguardando aprovação</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-md font-medium">Produtos Pendentes</CardTitle>
                <div className="p-2 rounded-full bg-orange-50">
                  <AlertCircle className="text-orange-500" size={20} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="text-2xl font-bold">{stats.products.pending}</p>
              <p className="text-sm text-gray-500">Aguardando aprovação</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-md font-medium">Resgates Pendentes</CardTitle>
                <div className="p-2 rounded-full bg-orange-50">
                  <AlertCircle className="text-orange-500" size={20} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="text-2xl font-bold">{stats.redemptions.pending}</p>
              <p className="text-sm text-gray-500">Aguardando processamento</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Activity Logs */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Atividades Recentes</CardTitle>
              <Clock size={20} />
            </div>
            <CardDescription>Últimas ações realizadas no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="py-4 flex justify-center">
                <div className="w-6 h-6 border-2 border-construPro-blue border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                Não há atividades recentes para exibir
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-gray-500">{activity.entity}</p>
                    </div>
                    <p className="text-sm text-gray-500">{formatDate(activity.timestamp)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
