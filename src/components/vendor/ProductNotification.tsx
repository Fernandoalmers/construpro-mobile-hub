
import React from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { 
  Card,
  CardContent
} from '@/components/ui/card';

interface ProductNotificationProps {
  status: 'aprovado' | 'pendente' | 'inativo' | 'none';
  onDismiss: () => void;
}

const ProductNotification: React.FC<ProductNotificationProps> = ({ status, onDismiss }) => {
  if (status === 'none') return null;
  
  const getNotificationContent = () => {
    switch (status) {
      case 'aprovado':
        return {
          icon: <CheckCircle className="h-6 w-6 text-green-500" />,
          title: 'Produto aprovado',
          message: 'Seu produto foi aprovado com sucesso e já está visível no marketplace.',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'pendente':
        return {
          icon: <AlertCircle className="h-6 w-6 text-amber-500" />,
          title: 'Produto em análise',
          message: 'Seu produto foi enviado para análise e será avaliado pela nossa equipe.',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200'
        };
      case 'inativo':
        return {
          icon: <XCircle className="h-6 w-6 text-red-500" />,
          title: 'Produto não aprovado',
          message: 'Seu produto não foi aprovado. Por favor, revise as informações e tente novamente.',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      default:
        return null;
    }
  };
  
  const content = getNotificationContent();
  if (!content) return null;
  
  return (
    <Card className={`mb-4 border ${content.borderColor} ${content.bgColor}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {content.icon}
            <div>
              <h4 className="font-medium">{content.title}</h4>
              <p className="text-sm text-gray-600">{content.message}</p>
            </div>
          </div>
          <button 
            onClick={onDismiss}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Fechar notificação"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductNotification;
