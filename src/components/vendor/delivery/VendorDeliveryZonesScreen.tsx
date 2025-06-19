
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit, Trash2, MapPin, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/context/AuthContext';
import { useVendorProfile } from '@/hooks/useVendorProfile';
import {
  getVendorDeliveryZones,
  deleteVendorDeliveryZone,
  VendorDeliveryZone
} from '@/services/vendor/deliveryZones';
import DeliveryZoneModal from './DeliveryZoneModal';
import LoadingState from '@/components/common/LoadingState';

const VendorDeliveryZonesScreen: React.FC = () => {
  const { user } = useAuth();
  const { vendorProfile } = useVendorProfile();
  const [zones, setZones] = useState<VendorDeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<VendorDeliveryZone | null>(null);

  useEffect(() => {
    if (vendorProfile?.id) {
      loadZones();
    }
  }, [vendorProfile?.id]);

  const loadZones = async () => {
    if (!vendorProfile?.id) return;
    
    try {
      setLoading(true);
      const data = await getVendorDeliveryZones(vendorProfile.id);
      setZones(data);
    } catch (error) {
      console.error('Error loading delivery zones:', error);
      toast.error('Erro ao carregar zonas de entrega');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    try {
      await deleteVendorDeliveryZone(zoneId);
      setZones(zones.filter(zone => zone.id !== zoneId));
      toast.success('Zona de entrega removida');
    } catch (error) {
      console.error('Error deleting zone:', error);
      toast.error('Erro ao remover zona de entrega');
    }
  };

  const handleEditZone = (zone: VendorDeliveryZone) => {
    setEditingZone(zone);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingZone(null);
    loadZones();
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

  const getZoneTypeColor = (type: string) => {
    const colors = {
      'cep_specific': 'bg-blue-100 text-blue-800',
      'cep_range': 'bg-green-100 text-green-800',
      'ibge': 'bg-yellow-100 text-yellow-800',
      'cidade': 'bg-purple-100 text-purple-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <LoadingState text="Carregando zonas de entrega..." />;
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
                <h1 className="text-xl font-semibold text-gray-900">Zonas de Entrega</h1>
                <p className="text-sm text-gray-500">Configure as regiões onde você faz entregas</p>
              </div>
            </div>
            <Button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Nova Zona
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {zones.length === 0 ? (
          <Card className="p-8 text-center">
            <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma zona de entrega configurada
            </h3>
            <p className="text-gray-500 mb-6">
              Configure as regiões onde você faz entregas para melhorar a experiência dos seus clientes
            </p>
            <Button onClick={() => setModalOpen(true)} className="flex items-center gap-2">
              <Plus size={16} />
              Criar primeira zona
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {zones.map((zone) => (
              <Card key={zone.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {zone.zone_name}
                    </h3>
                    <Badge className={`${getZoneTypeColor(zone.zone_type)} border-0`}>
                      {getZoneTypeLabel(zone.zone_type)}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditZone(zone)}
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteZone(zone.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={14} />
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                      {zone.zone_value}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={14} />
                    <span>{zone.delivery_time}</span>
                  </div>
                  
                  {zone.delivery_fee > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign size={14} />
                      <span>R$ {zone.delivery_fee.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <DeliveryZoneModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onClose={handleModalClose}
        vendorId={vendorProfile?.id || ''}
        editingZone={editingZone}
      />
    </div>
  );
};

export default VendorDeliveryZonesScreen;
