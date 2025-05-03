
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getVendorProducts, 
  updateProductStatus, 
  deleteVendorProduct, 
  VendorProduct,
  subscribeToVendorProducts,
  getVendorProfile
} from '@/services/vendorService';
import { toast } from '@/components/ui/sonner';
import ProductFilters from './ProductFilters';
import ProductList from './ProductList';
import ProductActions from './ProductActions';
import LoadingState from '../common/LoadingState';
import { RealtimeChannel } from '@supabase/supabase-js';

const ProductManagementScreen: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  
  // Fetch products
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['vendorProducts'],
    queryFn: getVendorProducts,
  });

  // Estado para armazenar o canal de realtime
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);
  
  // Configurar assinatura em tempo real para produtos
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      try {
        // Obter o ID do vendedor
        const vendorProfile = await getVendorProfile();
        if (!vendorProfile) {
          console.error('Perfil do vendedor não encontrado');
          return;
        }
        
        // Cancelar assinatura anterior se existir
        if (realtimeChannel) {
          realtimeChannel.unsubscribe();
        }
        
        // Configurar nova assinatura
        const channel = subscribeToVendorProducts(vendorProfile.id, (product, eventType) => {
          // Revalidar a consulta de produtos para atualizar a UI
          queryClient.invalidateQueries({ queryKey: ['vendorProducts'] });
          
          // Exibir notificações relevantes
          if (eventType === 'INSERT') {
            toast.success('Novo produto adicionado');
          } else if (eventType === 'UPDATE') {
            toast.success(`Produto "${product.nome}" atualizado`);
          } else if (eventType === 'DELETE') {
            toast.info('Produto removido');
          }
        });
        
        setRealtimeChannel(channel);
        
        // Limpar assinatura ao desmontar o componente
        return () => {
          if (channel) {
            channel.unsubscribe();
          }
        };
      } catch (error) {
        console.error('Erro ao configurar assinatura em tempo real:', error);
      }
    };
    
    setupRealtimeSubscription();
  }, [queryClient]);
  
  // Toggle product status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ productId, newStatus }: { productId: string; newStatus: 'pendente' | 'aprovado' | 'inativo' }) => {
      return await updateProductStatus(productId, newStatus);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorProducts'] });
      toast.success('Status do produto atualizado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar status do produto');
      console.error('Error toggling product status:', error);
    }
  });
  
  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (productId: string) => {
      return deleteVendorProduct(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorProducts'] });
      toast.success('Produto excluído com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao excluir produto');
      console.error('Error deleting product:', error);
    }
  });

  // Filter products based on search and status
  const filteredProducts = products.filter(produto => {
    const matchesSearch = searchTerm === '' || 
      produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === null || produto.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleToggleStatus = (productId: string, currentStatus: string) => {
    // Logic to determine the next status
    let newStatus: 'pendente' | 'aprovado' | 'inativo';
    
    if (currentStatus === 'ativo' || currentStatus === 'aprovado') {
      newStatus = 'inativo';
    } else {
      newStatus = 'pendente';
    }
    
    toggleStatusMutation.mutate({ productId, newStatus });
  };
  
  const handleDelete = (productId: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      deleteProductMutation.mutate(productId);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus(null);
  };
  
  if (error) {
    toast.error('Erro ao carregar produtos');
    console.error('Error fetching products:', error);
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-construPro-blue p-6 pt-12 flex items-center">
        <button onClick={() => navigate('/vendor')} className="mr-4 text-white">
          <ArrowLeft size={24} />
        </button>
        <ShoppingBag className="text-white mr-2" size={24} />
        <h1 className="text-xl font-bold text-white">Gerenciar Produtos</h1>
      </div>
      
      {/* Content */}
      <div className="p-6 space-y-4">
        <ProductFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
        />
        
        <ProductActions />
        
        {isLoading ? (
          <LoadingState text="Carregando produtos..." />
        ) : (
          <ProductList
            products={filteredProducts}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDelete}
            onEdit={(id) => navigate(`/vendor/product-edit/${id}`)}
            onClearFilters={handleClearFilters}
          />
        )}
      </div>
    </div>
  );
};

export default ProductManagementScreen;
