
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  Truck, 
  AlertCircle, 
  Calendar, 
  Package, 
  CircleDollarSign,
  User,
  Mail,
  Phone,
  MapPin,
  Tag 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Address } from '@/services/addressService';
import LoadingState from '@/components/common/LoadingState';

interface Redemption {
  id: string;
  item: string;
  pontos: number;
  status: string;
  data?: string;
  codigo?: string;
  imagem_url?: string;
  created_at: string;
  updated_at?: string;
  categoria?: string;
  descricao?: string;
  prazo_entrega?: string;
  cliente_id?: string;
}

interface UserProfile {
  nome?: string;
  email?: string;
  telefone?: string;
}

interface RedemptionDetailsDialogProps {
  redemptionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RedemptionDetailsDialog: React.FC<RedemptionDetailsDialogProps> = ({
  redemptionId,
  open,
  onOpenChange
}) => {
  const { user } = useAuth();
  const [redemption, setRedemption] = React.useState<Redemption | null>(null);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [address, setAddress] = React.useState<Address | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Format date in a user-friendly way
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Data não disponível';
    try {
      return format(new Date(dateString), "dd 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR });
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

  React.useEffect(() => {
    const fetchRedemptionDetails = async () => {
      if (!redemptionId || !open) return;

      try {
        setIsLoading(true);
        setError(null);

        // Fetch the redemption details
        const { data: redemptionData, error: redemptionError } = await supabase
          .from('resgates')
          .select('*')
          .eq('id', redemptionId)
          .single();

        if (redemptionError) throw redemptionError;

        setRedemption(redemptionData as Redemption);

        // Fetch user profile data
        const clientId = redemptionData.cliente_id || user?.id;
        
        if (clientId) {
          // Fetch customer profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('nome, email, telefone')
            .eq('id', clientId)
            .single();

          if (!profileError && profileData) {
            setUserProfile(profileData);
          }

          // Fetch the primary address if available
          const { data: addressData, error: addressError } = await supabase
            .from('user_addresses')
            .select('*')
            .eq('user_id', clientId)
            .eq('principal', true)
            .single();

          if (!addressError && addressData) {
            setAddress(addressData as Address);
          }
        }
      } catch (err: any) {
        console.error('Error fetching redemption details:', err);
        setError(err.message || 'Failed to fetch redemption details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRedemptionDetails();
  }, [redemptionId, open, user?.id]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-800">
            Detalhes do Resgate
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8">
            <LoadingState text="Carregando detalhes..." />
          </div>
        ) : error ? (
          <div className="py-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-2" />
            <p className="text-red-500">{error}</p>
          </div>
        ) : redemption ? (
          <div className="space-y-6">
            {/* Redemption item information */}
            <div className="flex gap-4 items-center">
              <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden relative">
                {redemption.imagem_url ? (
                  <img
                    src={redemption.imagem_url}
                    alt={redemption.item}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-construPro-blue/10">
                    <Package className="h-8 w-8 text-construPro-blue" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900">{redemption.item}</h3>
                
                {redemption.descricao && (
                  <p className="text-sm text-gray-500 mt-1">{redemption.descricao}</p>
                )}
                
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-construPro-orange/10 text-construPro-orange hover:bg-construPro-orange/20 border-none">
                    <CircleDollarSign className="h-3 w-3 mr-1" />
                    {redemption.pontos} pontos
                  </Badge>
                  
                  {redemption.categoria && (
                    <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-none">
                      <Tag className="h-3 w-3 mr-1" />
                      {redemption.categoria}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {/* Status information */}
            <div className="border-t border-b border-gray-100 py-4">
              <h4 className="font-medium text-gray-700 mb-3">Status do Resgate</h4>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {redemption.status && (
                    <Badge className={`${getStatusInfo(redemption.status).color} border-none flex items-center gap-1 px-2 py-1`}>
                      {getStatusInfo(redemption.status).icon}
                      <span>{getStatusInfo(redemption.status).label}</span>
                    </Badge>
                  )}
                </div>
                
                <div className="text-sm text-gray-500 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(redemption.created_at)}
                </div>
              </div>
              
              {redemption.codigo && (
                <div className="mt-3 bg-gray-50 p-3 rounded-md border border-gray-100">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Código de resgate:</span> {redemption.codigo}
                  </p>
                </div>
              )}
              
              {redemption.prazo_entrega && (
                <p className="mt-2 text-sm text-gray-600">
                  <Truck className="h-4 w-4 inline mr-1" />
                  Prazo de entrega: {redemption.prazo_entrega}
                </p>
              )}
            </div>
            
            {/* Customer information */}
            {userProfile && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">Informações do Cliente</h4>
                <div className="space-y-2">
                  {userProfile.nome && (
                    <div className="flex items-center text-sm">
                      <User className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-gray-700">{userProfile.nome}</span>
                    </div>
                  )}
                  
                  {userProfile.email && (
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-gray-700">{userProfile.email}</span>
                    </div>
                  )}
                  
                  {userProfile.telefone && (
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-gray-700">{userProfile.telefone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Address information */}
            {address && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">Endereço de Entrega</h4>
                <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                    <div className="text-sm text-gray-700">
                      <p className="font-medium">{address.nome}</p>
                      <p>{address.logradouro}, {address.numero}{address.complemento ? `, ${address.complemento}` : ''}</p>
                      <p>{address.bairro}</p>
                      <p>{address.cidade} - {address.estado}</p>
                      <p>CEP: {address.cep}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Update history - if we had it */}
            {redemption.updated_at && redemption.updated_at !== redemption.created_at && (
              <div className="text-xs text-gray-500">
                <p>Última atualização: {formatDate(redemption.updated_at)}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-gray-500">Nenhuma informação disponível</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RedemptionDetailsDialog;
