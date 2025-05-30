
import React from 'react';
import { Package, Check, Clock, Truck, AlertCircle } from 'lucide-react';

interface TimelineStep {
  status: string;
  label: string;
  icon: React.ComponentType<any>;
  completed: boolean;
  timestamp?: string;
}

interface OrderTimelineProps {
  currentStatus: string;
  createdAt: string;
}

const OrderTimeline: React.FC<OrderTimelineProps> = ({ currentStatus, createdAt }) => {
  const getTimelineSteps = (): TimelineStep[] => {
    const statusOrder = ['pendente', 'confirmado', 'processando', 'enviado', 'entregue'];
    const currentIndex = statusOrder.indexOf(currentStatus.toLowerCase());
    
    return [
      {
        status: 'pendente',
        label: 'Pedido Recebido',
        icon: Package,
        completed: currentIndex >= 0,
        timestamp: currentIndex >= 0 ? createdAt : undefined
      },
      {
        status: 'confirmado',
        label: 'Pedido Confirmado',
        icon: Check,
        completed: currentIndex >= 1,
        timestamp: currentIndex >= 1 ? createdAt : undefined
      },
      {
        status: 'processando',
        label: 'Processando',
        icon: Clock,
        completed: currentIndex >= 2,
        timestamp: currentIndex >= 2 ? createdAt : undefined
      },
      {
        status: 'enviado',
        label: 'Enviado',
        icon: Truck,
        completed: currentIndex >= 3,
        timestamp: currentIndex >= 3 ? createdAt : undefined
      },
      {
        status: 'entregue',
        label: 'Entregue',
        icon: Check,
        completed: currentIndex >= 4,
        timestamp: currentIndex >= 4 ? createdAt : undefined
      }
    ];
  };

  const steps = getTimelineSteps();
  const isCanceled = currentStatus.toLowerCase() === 'cancelado';

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isCanceled) {
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded-md">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle size={20} />
          <span className="font-medium">Pedido Cancelado</span>
        </div>
        <p className="text-sm text-red-600 mt-1">
          Este pedido foi cancelado em {formatTimestamp(createdAt)}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Acompanhamento do Pedido</h3>
      <div className="space-y-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.completed;
          
          return (
            <div key={step.status} className="flex items-start gap-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isActive 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-gray-100 text-gray-400'
              }`}>
                <Icon size={16} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${
                    isActive ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </p>
                  {step.timestamp && (
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(step.timestamp)}
                    </span>
                  )}
                </div>
                
                {index < steps.length - 1 && (
                  <div className={`w-px h-6 ml-4 mt-2 ${
                    isActive ? 'bg-green-200' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTimeline;
