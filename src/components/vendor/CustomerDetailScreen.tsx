
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Phone, Mail, Calendar, CreditCard, 
  TrendingUp, TrendingDown, Plus, Minus, RefreshCcw 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/sonner';
import { createPointAdjustment } from '@/services/vendorPointsService';
import { useCustomerDetail } from '@/hooks/vendor/useCustomerDetail';
import LoadingState from '../common/LoadingState';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import VendorPagination from './common/VendorPagination';
import { usePagination } from '@/hooks/vendor/usePagination';

const CustomerDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Point adjustment state
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');
  const [pointsValue, setPointsValue] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Use customer detail hook
  const { 
    customer, 
    customerPoints, 
    pointAdjustments, 
    isLoading, 
    error,
    refreshCustomerData 
  } = useCustomerDetail(id || '');
  
  // Setup pagination for point adjustments
  const { 
    paginatedItems: paginatedAdjustments, 
    currentPage, 
    totalPages, 
    onPageChange 
  } = usePagination(pointAdjustments, 10);
  
  if (isLoading) return <LoadingState text="Carregando dados do cliente..." />;
  
  if (error || !customer) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold mb-4 text-red-500">
            Cliente não encontrado
          </h2>
          <p className="mb-4 text-gray-600">
            Não foi possível encontrar os dados do cliente solicitado.
          </p>
          <Button onClick={() => navigate('/vendor/customers')}>
            Voltar para Lista de Clientes
          </Button>
        </Card>
      </div>
    );
  }

  // Handle point adjustment submission
  const handleAdjustPoints = async () => {
    if (!pointsValue || pointsValue <= 0) {
      toast.error('Por favor, insira uma quantidade válida de pontos');
      return;
    }

    if (!reason.trim()) {
      toast.error('Por favor, insira um motivo para o ajuste');
      return;
    }

    // Check if trying to remove more points than available
    if (adjustmentType === 'remove' && pointsValue > customerPoints) {
      toast.error(`Cliente possui apenas ${customerPoints} pontos disponíveis`);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createPointAdjustment(
        customer.usuario_id,
        adjustmentType,
        adjustmentType === 'add' ? pointsValue : -pointsValue,
        reason
      );

      if (result) {
        toast.success(`Pontos ${adjustmentType === 'add' ? 'adicionados' : 'removidos'} com sucesso`);
        setIsDialogOpen(false);
        setPointsValue(0);
        setReason('');
        
        // Refresh data
        refreshCustomerData();
      } else {
        toast.error(`Erro ao ${adjustmentType === 'add' ? 'adicionar' : 'remover'} pontos`);
      }
    } catch (error) {
      toast.error('Ocorreu um erro ao processar a solicitação');
      console.error('Error adjusting points:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      <div className="bg-white p-4 shadow-sm">
        <div className="flex justify-between items-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/vendor/customers')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Voltar para Clientes
          </Button>
          <Button 
            variant="outline"
            onClick={refreshCustomerData}
            className="flex items-center gap-2"
          >
            <RefreshCcw size={16} />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="p-6">
        {/* Customer Header Card */}
        <Card className="mb-6 p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
              <User size={36} />
            </div>
            <div className="flex-grow">
              <h1 className="text-2xl font-bold mb-1">{customer.nome || "Cliente sem nome"}</h1>
              <div className="flex flex-col sm:flex-row gap-4">
                {customer.email && (
                  <div className="flex items-center gap-1 text-gray-500">
                    <Mail size={16} />
                    <span>{customer.email}</span>
                  </div>
                )}
                {customer.telefone && (
                  <div className="flex items-center gap-1 text-gray-500">
                    <Phone size={16} />
                    <span>{customer.telefone}</span>
                  </div>
                )}
                {customer.ultimo_pedido && (
                  <div className="flex items-center gap-1 text-gray-500">
                    <Calendar size={16} />
                    <span>Último pedido: {new Date(customer.ultimo_pedido).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col md:items-end gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500">Saldo de pontos:</span>
                <span className="text-xl font-bold">{customerPoints}</span>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Ajustar Pontos</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajustar Pontos do Cliente</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <RadioGroup 
                      value={adjustmentType} 
                      onValueChange={(value) => setAdjustmentType(value as 'add' | 'remove')}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="add" id="add" />
                        <Label htmlFor="add" className="flex items-center gap-1">
                          <Plus size={16} className="text-green-500" />
                          Adicionar
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="remove" id="remove" />
                        <Label htmlFor="remove" className="flex items-center gap-1">
                          <Minus size={16} className="text-red-500" />
                          Remover
                        </Label>
                      </div>
                    </RadioGroup>
                    
                    <div className="space-y-2">
                      <Label htmlFor="points">Quantidade de Pontos</Label>
                      <Input
                        id="points"
                        type="number"
                        min="1"
                        value={pointsValue || ''}
                        onChange={(e) => setPointsValue(parseInt(e.target.value) || 0)}
                        className="col-span-3"
                      />
                      {adjustmentType === 'remove' && (
                        <p className="text-sm text-gray-500">
                          Saldo atual: {customerPoints} pontos
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reason">Motivo</Label>
                      <Textarea
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Descreva o motivo do ajuste de pontos"
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleAdjustPoints}
                      disabled={isSubmitting || !pointsValue || pointsValue <= 0 || !reason.trim()}
                    >
                      {isSubmitting ? 'Processando...' : 'Confirmar'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </Card>

        {/* Tabs for different sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="points">Histórico de Pontos</TabsTrigger>
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <h3 className="text-sm font-medium text-gray-500">Total Gasto</h3>
                <p className="text-2xl font-bold">R$ {customer.total_gasto?.toFixed(2) || '0.00'}</p>
              </Card>
              <Card className="p-4">
                <h3 className="text-sm font-medium text-gray-500">Pontos Acumulados</h3>
                <p className="text-2xl font-bold">{customerPoints}</p>
              </Card>
              <Card className="p-4">
                <h3 className="text-sm font-medium text-gray-500">Cliente Desde</h3>
                <p className="text-2xl font-bold">
                  {customer.created_at 
                    ? format(new Date(customer.created_at), 'dd MMM yyyy', {locale: ptBR}) 
                    : 'N/A'}
                </p>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Resumo da Atividade do Cliente</h3>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Total de compras</span>
                  <span className="font-medium">
                    {customer.ultimo_pedido ? '1+' : '0'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Última compra</span>
                  <span className="font-medium">
                    {customer.ultimo_pedido 
                      ? format(new Date(customer.ultimo_pedido), 'dd/MM/yyyy') 
                      : 'Nunca'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Valor médio por compra</span>
                  <span className="font-medium">
                    R$ {customer.ultimo_pedido && customer.total_gasto 
                      ? (customer.total_gasto).toFixed(2) 
                      : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Status</span>
                  <span className="font-medium">
                    {new Date(customer.ultimo_pedido || 0) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
                      ? 'Ativo'
                      : 'Inativo'}
                  </span>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="points" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Histórico de Ajustes de Pontos</h3>
              
              {paginatedAdjustments.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500">Nenhum ajuste de pontos encontrado para este cliente.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 text-left">
                      <tr>
                        <th className="px-4 py-2 text-sm font-medium text-gray-500">Data</th>
                        <th className="px-4 py-2 text-sm font-medium text-gray-500">Tipo</th>
                        <th className="px-4 py-2 text-sm font-medium text-gray-500">Pontos</th>
                        <th className="px-4 py-2 text-sm font-medium text-gray-500">Motivo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {paginatedAdjustments.map((adjustment) => (
                        <tr key={adjustment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            {format(new Date(adjustment.created_at || new Date()), 'dd/MM/yyyy HH:mm')}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-1">
                              {adjustment.valor > 0 ? (
                                <>
                                  <TrendingUp 
                                    size={16} 
                                    className="text-green-500" 
                                  />
                                  <span>Adição</span>
                                </>
                              ) : (
                                <>
                                  <TrendingDown 
                                    size={16} 
                                    className="text-red-500" 
                                  />
                                  <span>Remoção</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={adjustment.valor > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                              {adjustment.valor > 0 ? `+${adjustment.valor}` : adjustment.valor}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {adjustment.motivo}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Pagination for point adjustments */}
                  <VendorPagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={onPageChange}
                  />
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Histórico de Pedidos</h3>
              
              {/* To be implemented in the future phase */}
              <div className="text-center py-6">
                <p className="text-gray-500">Detalhes dos pedidos serão implementados em breve.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate('/vendor/orders')}
                >
                  Ver Todos os Pedidos
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CustomerDetailScreen;
