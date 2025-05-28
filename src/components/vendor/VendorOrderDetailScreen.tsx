import React, { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Package, MapPin, Calendar, CreditCard, Loader2, Check, Download, Mail, Phone } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPedidoById, type Pedido } from '@/services/vendor/orders/pedidosService';
import LoadingState from '../common/LoadingState';
import { toast } from '@/components/ui/sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useReactToPrint } from 'react-to-print';
import OrderPrintTemplate from './OrderPrintTemplate';

const VendorOrderDetailScreen: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  
  // Fetch specific order by ID using the pedidos service
  const { 
    data: pedido, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['vendorPedido', id],
    queryFn: () => getPedidoById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // PDF Print handler - moved after pedido declaration
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Pedido-${pedido?.id?.substring(0, 8) || 'unknown'}`,
    onAfterPrint: () => {
      toast.success("PDF gerado com sucesso!");
    },
  });
  
  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ pedidoId, status }: { pedidoId: string, status: string }) => {
      setUpdatingStatus(true);
      
      const { error } = await supabase
        .from('pedidos')
        .update({ status })
        .eq('id', pedidoId);
      
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorPedido', id] });
      queryClient.invalidateQueries({ queryKey: ['vendorPedidos'] });
      toast.success("Status do pedido atualizado com sucesso");
      setUpdatingStatus(false);
    },
    onError: (error) => {
      console.error("Error updating order status:", error);
      toast.error("Erro ao atualizar status do pedido");
      setUpdatingStatus(false);
    },
  });
  
  const handleUpdateStatus = (newStatus: string) => {
    if (id) {
      updateStatusMutation.mutate({ pedidoId: id, status: newStatus });
    }
  };

  // Helper function to get a valid image URL
  const getProductImageUrl = (produto: any): string | null => {
    if (!produto?.imagens || !Array.isArray(produto.imagens) || produto.imagens.length === 0) {
      return null;
    }
    
    const firstImage = produto.imagens[0];
    if (typeof firstImage === 'string') {
      return firstImage;
    }
    
    if (typeof firstImage === 'object' && firstImage.url) {
      return firstImage.url;
    }
    
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <div className="bg-white p-4 flex items-center shadow-sm">
          <button onClick={() => navigate('/vendor/orders')} className="mr-4">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Carregando pedido...</h1>
        </div>
        <div className="p-6">
          <LoadingState text="Carregando detalhes do pedido" />
        </div>
      </div>
    );
  }
  
  if (error || !pedido) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <div className="bg-white p-4 flex items-center shadow-sm">
          <button onClick={() => navigate('/vendor/orders')} className="mr-4">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Pedido não encontrado</h1>
        </div>
        <div className="text-center p-10">
          <Package className="mx-auto text-gray-400 mb-3" size={40} />
          <h3 className="text-lg font-medium text-gray-700">Pedido não encontrado</h3>
          <p className="text-gray-500 mt-1">O pedido que você está procurando não existe ou você não tem permissão para visualizá-lo</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate('/vendor/orders')}
          >
            Voltar para pedidos
          </Button>
        </div>
      </div>
    );
  }

  const orderItems = pedido.itens || [];
  
  // Status options
  const statusOptions = [
    { value: 'pendente', label: 'Pendente' },
    { value: 'confirmado', label: 'Confirmado' },
    { value: 'processando', label: 'Em processamento' },
    { value: 'enviado', label: 'Enviado' },
    { value: 'entregue', label: 'Entregue' },
    { value: 'cancelado', label: 'Cancelado' }
  ];
  
  // Status badge styling
  const getStatusBadge = (status: string) => {
    const lowerStatus = status.toLowerCase();
    switch(lowerStatus) {
      case "entregue":
        return "bg-green-100 text-green-800";
      case "enviado":
        return "bg-blue-100 text-blue-800";
      case "processando":
        return "bg-yellow-100 text-yellow-800";
      case "confirmado":
        return "bg-purple-100 text-purple-800";
      case "pendente":
        return "bg-orange-100 text-orange-800";
      case "cancelado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <>
      <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
        {/* Header */}
        <div className="bg-white p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center">
            <button onClick={() => navigate('/vendor/orders')} className="mr-4">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-xl font-bold">Detalhes do Pedido</h1>
          </div>
          <Button 
            onClick={handlePrint}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download size={16} />
            Exportar PDF
          </Button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Order Summary */}
          <Card className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Pedido #{pedido.id.substring(0, 8)}</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(pedido.status)}`}>
                {pedido.status}
              </span>
            </div>
            
            <div className="flex flex-col gap-2 text-sm mb-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar size={16} />
                <span>Realizado em {formatDate(pedido.created_at)}</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600">
                <CreditCard size={16} />
                <span>Pagamento: {pedido.forma_pagamento}</span>
              </div>
            </div>
            
            {/* Improved Client Information Display */}
            {pedido.cliente && (
              <div className="bg-blue-50 p-4 rounded-md mb-4">
                <h4 className="font-medium mb-3 text-blue-900">Informações do Cliente</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm"><strong>Nome:</strong> {pedido.cliente.nome}</p>
                    <p className="text-sm"><strong>Total gasto:</strong> R$ {Number(pedido.cliente.total_gasto).toFixed(2)}</p>
                  </div>
                  <div className="space-y-2">
                    {pedido.cliente.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail size={14} className="text-gray-600" />
                        <span>{pedido.cliente.email}</span>
                      </div>
                    )}
                    {pedido.cliente.telefone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone size={14} className="text-gray-600" />
                        <span>{pedido.cliente.telefone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {pedido.endereco_entrega && (
              <div className="bg-gray-50 p-3 rounded-md mb-4">
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-gray-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Endereço de entrega</p>
                    <p className="text-sm text-gray-600">
                      {typeof pedido.endereco_entrega === 'string' 
                        ? pedido.endereco_entrega
                        : (
                          pedido.endereco_entrega.logradouro 
                            ? `${pedido.endereco_entrega.logradouro}, ${pedido.endereco_entrega.numero}, ${pedido.endereco_entrega.cidade} - ${pedido.endereco_entrega.estado}`
                            : JSON.stringify(pedido.endereco_entrega)
                        )
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Status Update Section */}
            <div className="mt-4">
              <h4 className="font-medium mb-2">Atualizar status do pedido</h4>
              <div className="flex gap-2 items-center">
                <Select
                  value={pedido.status.toLowerCase()}
                  onValueChange={(value) => handleUpdateStatus(value)}
                  disabled={updatingStatus}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {updatingStatus && <Loader2 className="animate-spin text-gray-500" size={20} />}
                {updateStatusMutation.isSuccess && <Check className="text-green-500" size={20} />}
              </div>
            </div>
          </Card>
          
          {/* Order Items */}
          <Card className="p-4">
            <h3 className="font-medium mb-3">Itens do pedido</h3>
            
            {orderItems.length === 0 ? (
              <p className="text-center py-4 text-gray-500">Nenhum item encontrado neste pedido</p>
            ) : (
              <div className="divide-y">
                {orderItems.map((item, index) => {
                  const imageUrl = getProductImageUrl(item.produto);
                  
                  return (
                    <div key={index} className="py-3 flex">
                      <div 
                        className="w-16 h-16 bg-gray-200 rounded mr-3 bg-center bg-cover flex-shrink-0 flex items-center justify-center"
                        style={imageUrl ? { 
                          backgroundImage: `url(${imageUrl})`
                        } : {}}
                      >
                        {!imageUrl && (
                          <Package size={24} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.produto?.nome || 'Produto indisponível'}</h4>
                        <p className="text-sm text-gray-500">Qtd: {item.quantidade}</p>
                        <p className="text-sm font-medium mt-1">
                          R$ {Number(item.total).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <Separator className="my-4" />
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>R$ {Number(pedido.valor_total).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Frete:</span>
                <span>Grátis</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span>R$ {Number(pedido.valor_total).toFixed(2)}</span>
              </div>
            </div>
          </Card>
          
          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/vendor/orders')}
            >
              Voltar
            </Button>
          </div>
        </div>
      </div>

      {/* Hidden Print Template */}
      <div style={{ display: 'none' }}>
        <OrderPrintTemplate ref={printRef} pedido={pedido} />
      </div>
    </>
  );
};

export default VendorOrderDetailScreen;
