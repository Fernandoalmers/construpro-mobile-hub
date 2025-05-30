import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AdminOrder, getOrderStatusBadgeColor } from '@/services/adminOrdersService';
import { Package, MapPin, CreditCard, Calendar, Store, Award, AlertTriangle, Tag } from 'lucide-react';

interface OrderDetailsModalProps {
  order: AdminOrder | null;
  open: boolean;
  onClose: () => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ order, open, onClose }) => {
  if (!order) return null;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle address display (can be string or object)
  const renderAddress = () => {
    if (!order.endereco_entrega) return "Endereço não disponível";
    
    if (typeof order.endereco_entrega === 'string') {
      return order.endereco_entrega;
    }
    
    const endereco = order.endereco_entrega;
    
    if (typeof endereco === 'object') {
      // Handle the current address structure (rua, numero, bairro, cidade, estado, cep)
      if ('rua' in endereco || 'cidade' in endereco || 'estado' in endereco) {
        const rua = endereco.rua || '';
        const numero = endereco.numero || '';
        const complemento = endereco.complemento || '';
        const bairro = endereco.bairro || '';
        const cidade = endereco.cidade || '';
        const estado = endereco.estado || '';
        const cep = endereco.cep || '';
        
        // Build address string with proper formatting
        const parts = [];
        
        if (rua) {
          let ruaText = rua;
          if (numero) ruaText += `, ${numero}`;
          if (complemento) ruaText += `, ${complemento}`;
          parts.push(ruaText);
        }
        
        if (bairro) parts.push(bairro);
        if (cidade && estado) {
          parts.push(`${cidade} - ${estado}`);
        } else if (cidade) {
          parts.push(cidade);
        } else if (estado) {
          parts.push(estado);
        }
        
        if (cep) parts.push(`CEP: ${cep}`);
        
        return parts.join(', ') || 'Endereço não disponível';
      }
      
      // Handle legacy address structures (logradouro, street)
      if ('logradouro' in endereco) {
        return `${endereco.logradouro}, ${endereco.numero || 'S/N'}${endereco.complemento ? `, ${endereco.complemento}` : ''}, ${endereco.bairro || ''}, ${endereco.cidade || ''} - ${endereco.estado || ''}, ${endereco.cep || ''}`;
      } else if ('street' in endereco) {
        return `${endereco.street}, ${endereco.number || 'S/N'}${endereco.complement ? `, ${endereco.complement}` : ''}, ${endereco.neighborhood || ''}, ${endereco.city || ''} - ${endereco.state || ''}, ${endereco.zipCode || ''}`;
      }
    }
    
    return 'Endereço não disponível';
  };

  // Calculate totals and discount information
  const itemsTotal = order.items ? order.items.reduce((sum, item) => sum + item.subtotal, 0) : 0;
  const discount = itemsTotal - order.valor_total;
  const hasDiscount = Math.abs(discount) > 0.01;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Detalhes do Pedido #{order.id.substring(0, 8)}</DialogTitle>
          <DialogDescription>
            Informações completas sobre este pedido
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow">
          <div className="space-y-6 p-1">
            {/* Order Status & Info */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Calendar size={16} />
                  <span>{formatDate(order.data_criacao || order.created_at)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <CreditCard size={16} />
                  <span>{order.forma_pagamento}</span>
                </div>
                
                {/* Points earned */}
                <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                  <Award size={16} />
                  <span>{order.pontos_ganhos || 0} pontos ganhos</span>
                </div>
              </div>
              
              <Badge className={getOrderStatusBadgeColor(order.status)}>
                {order.status}
              </Badge>
            </div>
            
            <Separator />
            
            {/* Customer & Vendor Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-sm mb-2">Cliente</h3>
                <p className="text-sm">{order.cliente_nome || 'Cliente não identificado'}</p>
                {order.cliente_id && (
                  <p className="text-xs text-muted-foreground mt-1">ID: {order.cliente_id.substring(0, 8)}</p>
                )}
              </div>
              
              {/* Vendor Information */}
              <div>
                <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <Store size={16} />
                  Vendedor
                </h3>
                <p className="text-sm">
                  {order.loja_nome || 'Loja não identificada'}
                </p>
                {order.loja_id && (
                  <p className="text-xs text-muted-foreground mt-1">ID: {order.loja_id.substring(0, 8)}</p>
                )}
              </div>
            </div>
            
            {/* Shipping Address */}
            <div>
              <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                <MapPin size={16} />
                Endereço de Entrega
              </h3>
              <p className="text-sm break-all">{renderAddress()}</p>
            </div>
            
            <Separator />
            
            {/* Order Items */}
            <div>
              <h3 className="font-medium text-sm mb-4">Itens do Pedido</h3>
              
              {order.items && order.items.length > 0 ? (
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 border-b pb-3">
                      <div className="bg-gray-100 h-10 w-10 rounded-md flex items-center justify-center">
                        <Package size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-medium text-sm">{item.produto_nome}</p>
                          <p className="text-sm">{formatCurrency(item.subtotal)}</p>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <p>{item.quantidade}x {formatCurrency(item.preco_unitario)}</p>
                          <p>ID: {item.produto_id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-md">
                  <AlertTriangle size={16} />
                  <p className="text-sm">
                    Nenhum item encontrado. 
                    {order.cliente_nome === 'Cliente Desconhecido' 
                      ? ' Possível problema de permissões ou dados corrompidos.' 
                      : ' Verifique se os itens do pedido foram registrados corretamente.'
                    }
                  </p>
                </div>
              )}
            </div>
            
            {/* Order Summary */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-sm mb-3">Resumo do Pedido</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal (itens):</span>
                  <span>{formatCurrency(itemsTotal)}</span>
                </div>
                
                {hasDiscount && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="flex items-center gap-1">
                      <Tag size={12} />
                      Desconto aplicado:
                    </span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span>Frete:</span>
                  <span>Grátis</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>{formatCurrency(order.valor_total)}</span>
                </div>
                
                {hasDiscount && (
                  <p className="text-xs text-green-600 mt-1">
                    ✅ Desconto de {formatCurrency(discount)} aplicado
                  </p>
                )}
              </div>
            </div>
            
            {/* Tracking Info */}
            {order.rastreio && (
              <>
                <Separator />
                <div>
                  <h3 className="font-medium text-sm mb-2">Informação de Rastreio</h3>
                  <p className="text-sm bg-blue-50 text-blue-800 p-2 rounded inline-block">
                    Código: {order.rastreio}
                  </p>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsModal;
