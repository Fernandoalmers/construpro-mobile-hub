
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, Clock, Truck, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Avatar from '@/components/common/Avatar';

interface Redemption {
  id: string;
  item: string;
  pontos: number;
  status: string;
  data?: string;
  codigo?: string;
  imagem_url?: string;
  created_at: string;
  descricao?: string;
}

interface RedemptionCardProps {
  redemption: Redemption;
  onClick?: (id: string) => void;
}

const RedemptionCard: React.FC<RedemptionCardProps> = ({ redemption, onClick }) => {
  // Format date in a user-friendly way
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd 'de' MMMM, yyyy", { locale: ptBR });
    } catch (e) {
      return dateString;
    }
  };

  // Get status info (icon, color, label)
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'aprovado':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          color: 'bg-green-100 text-green-800',
          label: 'Aprovado'
        };
      case 'pendente':
        return {
          icon: <Clock className="h-4 w-4" />,
          color: 'bg-amber-100 text-amber-800',
          label: 'Pendente'
        };
      case 'em_transito':
        return {
          icon: <Truck className="h-4 w-4" />,
          color: 'bg-blue-100 text-blue-800',
          label: 'Em Trânsito'
        };
      case 'entregue':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          color: 'bg-construPro-blue/10 text-construPro-blue',
          label: 'Entregue'
        };
      case 'recusado':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          color: 'bg-red-100 text-red-800',
          label: 'Recusado'
        };
      default:
        return {
          icon: <Clock className="h-4 w-4" />,
          color: 'bg-gray-100 text-gray-800',
          label: status.charAt(0).toUpperCase() + status.slice(1)
        };
    }
  };

  const statusInfo = getStatusInfo(redemption.status);

  const handleClick = () => {
    if (onClick) onClick(redemption.id);
  };

  // Generate a consistent color based on the item name for the avatar fallback
  const getAvatarColor = (name: string) => {
    const firstLetter = name.charAt(0).toUpperCase();
    const charCode = firstLetter.charCodeAt(0);
    return `hsl(${(charCode * 8) % 360}, 70%, 60%)`;
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md" 
      onClick={handleClick}
    >
      <div className="flex p-3">
        {/* Product Image with enhanced fallback */}
        <div className="relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden">
          {redemption.imagem_url ? (
            <img 
              src={redemption.imagem_url}
              alt={redemption.item}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.classList.add('flex', 'items-center', 'justify-center');
                target.parentElement!.style.backgroundColor = getAvatarColor(redemption.item);
                
                // Create text element with initials
                const text = document.createElement('div');
                text.className = 'text-white text-xl font-medium';
                text.textContent = redemption.item.charAt(0).toUpperCase();
                target.parentElement!.appendChild(text);
              }}
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: getAvatarColor(redemption.item) }}
            >
              <span className="text-white text-xl font-medium">
                {redemption.item.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="ml-3 flex-1">
          <div className="flex justify-between">
            <h3 className="font-medium text-gray-900 line-clamp-1">{redemption.item}</h3>
          </div>
          
          {redemption.descricao && (
            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{redemption.descricao}</p>
          )}
          
          <div className="flex items-center gap-2 mt-1.5">
            <Badge className="bg-construPro-orange/10 text-construPro-orange hover:bg-construPro-orange/20 border-none">
              {redemption.pontos} pontos
            </Badge>
            <span className="text-xs text-gray-500">{formatDate(redemption.created_at)}</span>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <Badge className={`${statusInfo.color} border-none flex items-center gap-1 px-2 py-0.5 font-normal`}>
              {statusInfo.icon}
              <span>{statusInfo.label}</span>
            </Badge>
            
            {redemption.codigo && (
              <div className="text-xs bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                Código: <span className="font-medium">{redemption.codigo}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedemptionCard;
