
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Package, MapPin, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/context/AuthContext';
import { useVendorProfile } from '@/hooks/useVendorProfile';
import {
  getVendorProductRestrictions,
  deleteProductRestriction,
  VendorProductRestriction
} from '@/services/vendor/deliveryZones';
import { getVendorProducts } from '@/services/vendor/products';
import ProductRestrictionModal from './ProductRestrictionModal';
import LoadingState from '@/components/common/LoadingState';

const ProductRestrictionsScreen: React.FC = () => {
  const { user } = useAuth();
  const { vendorProfile } = useVendorProfile();
  const [restrictions, setRestrictions] = useState<VendorProductRestriction[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (vendorProfile?.id) {
      loadData();
    }
  }, [vendorProfile?.id]);

  const loadData = async () => {
    if (!vendorProfile?.id) return;
    
    try {
      setLoading(true);
      const [restrictionsData, productsData] = await Promise.all([
        getVendorProductRestrictions(vendorProfile.id),
        getVendorProducts(vendorProfile.id)
      ]);
      
      setRestrictions(restrictionsData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRestriction = async (restrictionId: string) => {
    try {
      await deleteProductRestriction(restrictionId);
      setRestrictions(restrictions.filter(r => r.id !== restrictionId));
      toast.success('Restrição removida');
    } catch (error) {
      console.error('Error deleting restriction:', error);
      toast.error('Erro ao remover restrição');
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    loadData();
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.nome || 'Produto não encontrado';
  };

  const getRestrictionTypeLabel = (type: string) => {
    const labels = {
      'not_delivered': 'Não Entregamos',
      'freight_on_demand': 'Frete a Combinar',
      'higher_fee': 'Taxa Maior'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getRestrictionTypeColor = (type: string) => {
    const colors = {
      'not_delivered': 'bg-red-100 text-red-800',
      'freight_on_demand': 'bg-yellow-100 text-yellow-800',
      'higher_fee': 'bg-orange-100 text-orange-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getZoneTypeLabel = (type: string) => {
    const labels = {
      'cep_specific': 'CEP Específico',
      'cep_range': 'Faixa de CEP',
      'ibge': 'Código IBGE',
      'cidade': 'Cidade'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const filteredRestrictions = restrictions.filter(restriction => {
    const productName = getProductName(restriction.product_id).toLowerCase();
    const search = searchTerm.toLowerCase();
    return productName.includes(search) || 
           restriction.zone_value.toLowerCase().includes(search) ||
           restriction.restriction_message.toLowerCase().includes(search);
  });

  if (loading) {
    return <LoadingState text="Carregando restrições..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className="flex items-center"
              >
                <ArrowLeft size={16} className="mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Restrições de Produtos</h1>
                <p className="text-sm text-gray-500">Configure produtos que têm restrições de entrega</p>
              </div>
            </div>
            <Button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Nova Restrição
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Buscar por produto, região ou mensagem..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {filteredRestrictions.length === 0 ? (
          <Card className="p-8 text-center">
            <AlertTriangle size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Nenhuma restrição encontrada' : 'Nenhuma restrição configurada'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm 
                ? 'Tente usar outros termos de busca'
                : 'Configure restrições para produtos que não entregam em certas regiões'
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => setModalOpen(true)} className="flex items-center gap-2">
                <Plus size={16} />
                Criar primeira restrição
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRestrictions.map((restriction) => (
              <Card key={restriction.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <Package size={16} className="text-gray-500" />
                        <span className="font-medium text-gray-900">
                          {getProductName(restriction.product_id)}
                        </span>
                      </div>
                      <Badge className={`${getRestrictionTypeColor(restriction.restriction_type)} border-0`}>
                        {getRestrictionTypeLabel(restriction.restriction_type)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} />
                        <span>
                          <strong>{getZoneTypeLabel(restriction.zone_type)}:</strong> 
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded ml-2">
                            {restriction.zone_value}
                          </span>
                        </span>
                      </div>
                      
                      <div>
                        <strong>Mensagem:</strong> {restriction.restriction_message}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRestriction(restriction.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <ProductRestrictionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onClose={handleModalClose}
        vendorId={vendorProfile?.id || ''}
        products={products}
      />
    </div>
  );
};

export default ProductRestrictionsScreen;
