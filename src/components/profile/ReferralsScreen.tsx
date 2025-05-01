
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Users, Share2, Copy, UserCheck, Award } from 'lucide-react';
import Card from '../common/Card';
import CustomButton from '../common/CustomButton';
import { toast } from "@/components/ui/sonner";
import { useAuth } from '../../context/AuthContext';

// Mock referral data
const mockReferralData = {
  code: "AMIGO25",
  totalReferrals: 7,
  pendingReferrals: 2,
  pointsEarned: 2100,
  referredFriends: [
    { id: "ref1", name: "João Silva", date: "2025-04-15T10:30:00", status: "aprovado", points: 300 },
    { id: "ref2", name: "Maria Santos", date: "2025-04-12T14:45:00", status: "aprovado", points: 300 },
    { id: "ref3", name: "Pedro Lima", date: "2025-04-05T09:20:00", status: "aprovado", points: 300 },
    { id: "ref4", name: "Ana Costa", date: "2025-03-28T16:10:00", status: "aprovado", points: 300 },
    { id: "ref5", name: "Carlos Oliveira", date: "2025-03-22T11:35:00", status: "aprovado", points: 300 },
    { id: "ref6", name: "Lúcia Martins", date: "2025-04-18T08:50:00", status: "pendente", points: 0 },
    { id: "ref7", name: "Roberto Souza", date: "2025-04-20T15:25:00", status: "pendente", points: 0 }
  ]
};

const ReferralsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Get the referral code with fallback
  const referralCode = user?.codigo || mockReferralData.code;
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };
  
  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success("Código copiado para a área de transferência");
  };
  
  const handleShareWhatsApp = () => {
    const message = `Venha para a ConstruPro! Use meu código ${referralCode} e ganhe 300 pontos na primeira compra. https://construpro.com/convite`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-construPro-blue p-6 pt-12">
        <div className="flex items-center mb-4">
          <button onClick={() => navigate('/profile')} className="text-white">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-white ml-2">Indique e Ganhe</h1>
        </div>
      </div>
      
      {/* Referral Code Card */}
      <div className="px-6 -mt-6">
        <Card className="p-4">
          <h3 className="font-medium mb-1">Seu código de indicação</h3>
          <div className="bg-gray-50 rounded-md p-3 flex items-center justify-between mb-4">
            <span className="text-xl font-bold tracking-wider">
              {referralCode}
            </span>
            <button 
              className="text-construPro-blue"
              onClick={handleCopyCode}
            >
              <Copy size={18} />
            </button>
          </div>
          
          <div className="space-y-3">
            <CustomButton 
              variant="primary" 
              fullWidth
              onClick={handleShareWhatsApp}
              icon={<Share2 size={18} />}
            >
              Compartilhar via WhatsApp
            </CustomButton>
            
            <CustomButton 
              variant="outline" 
              fullWidth
              onClick={handleCopyCode}
              icon={<Copy size={18} />}
            >
              Copiar link de convite
            </CustomButton>
          </div>
        </Card>
      </div>
      
      {/* Referral Stats */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="p-3">
            <div className="flex flex-col items-center">
              <Users size={24} className="text-construPro-orange mb-2" />
              <span className="text-sm text-gray-600">Pessoas indicadas</span>
              <span className="text-xl font-bold">{mockReferralData.totalReferrals}</span>
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex flex-col items-center">
              <Award size={24} className="text-construPro-orange mb-2" />
              <span className="text-sm text-gray-600">Pontos ganhos</span>
              <span className="text-xl font-bold">{mockReferralData.pointsEarned}</span>
            </div>
          </Card>
        </div>
        
        <h2 className="font-medium mb-3">Como funciona</h2>
        <Card className="p-4 mb-6">
          <ol className="space-y-4">
            <li className="flex">
              <div className="bg-construPro-blue text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                1
              </div>
              <div>
                <p>Convide amigos para a ConstruPro usando seu código de indicação.</p>
              </div>
            </li>
            <li className="flex">
              <div className="bg-construPro-blue text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                2
              </div>
              <div>
                <p>Quando seu amigo se cadastrar e fizer a primeira compra, você ganha 300 pontos.</p>
              </div>
            </li>
            <li className="flex">
              <div className="bg-construPro-blue text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                3
              </div>
              <div>
                <p>Seu amigo também ganha 300 pontos no primeiro pedido!</p>
              </div>
            </li>
          </ol>
        </Card>
        
        <h2 className="font-medium mb-3">Amigos indicados</h2>
        {mockReferralData.referredFriends.length === 0 ? (
          <Card className="p-4">
            <div className="text-center py-6">
              <Users className="mx-auto text-gray-400 mb-3" size={40} />
              <h3 className="text-lg font-medium text-gray-700">Nenhum amigo indicado</h3>
              <p className="text-gray-500 mt-1">Comece a compartilhar seu código agora!</p>
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="divide-y divide-gray-100">
              {mockReferralData.referredFriends.map((friend) => (
                <div key={friend.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex">
                      <UserCheck size={20} className={friend.status === 'aprovado' ? 'text-green-600' : 'text-yellow-600'} />
                      <div className="ml-3">
                        <p className="font-medium">{friend.name}</p>
                        <p className="text-xs text-gray-500">Indicado em {formatDate(friend.date)}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        friend.status === 'aprovado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {friend.status === 'aprovado' ? 'Aprovado' : 'Pendente'}
                      </span>
                      {friend.points > 0 && (
                        <span className="text-sm font-medium text-green-600 mt-1">
                          +{friend.points} pts
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReferralsScreen;
