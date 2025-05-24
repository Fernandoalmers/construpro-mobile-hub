
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../common/Avatar';
import Card from '../common/Card';
import ListEmptyState from '../common/ListEmptyState';
import LoadingState from '../common/LoadingState';
import { MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { chatService, ChatConversation } from '@/services/chatService';
import { toast } from '@/components/ui/sonner';

const ChatScreen: React.FC = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await chatService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Erro ao carregar conversas');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSupportChat = async () => {
    try {
      const conversation = await chatService.getOrCreateSupportConversation();
      navigate(`/chat/${conversation.id}`);
    } catch (error) {
      console.error('Error creating support conversation:', error);
      toast.error('Erro ao iniciar conversa com suporte');
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays > 7) {
      return date.toLocaleDateString('pt-BR');
    } else if (diffDays > 0) {
      return `${diffDays}d atrás`;
    } else {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      
      if (diffHours > 0) {
        return `${diffHours}h atrás`;
      } else {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return diffMinutes > 0 ? `${diffMinutes}min atrás` : 'Agora';
      }
    }
  };

  const getConversationName = (conversation: ChatConversation) => {
    if (conversation.is_support) {
      return 'Suporte ConstruPro+';
    }
    return conversation.store?.nome || 'Loja desconhecida';
  };

  const getConversationAvatar = (conversation: ChatConversation) => {
    if (conversation.is_support) {
      return 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=150&h=150&fit=crop&q=80';
    }
    return conversation.store?.logo_url || 'https://via.placeholder.com/150';
  };

  if (loading) {
    return <LoadingState text="Carregando conversas..." />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-construPro-blue p-6 pt-12 rounded-b-3xl">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Chat</h1>
          <Button
            onClick={handleStartSupportChat}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            <Plus size={20} className="mr-2" />
            Suporte
          </Button>
        </div>
      </div>
      
      <div className="p-6 -mt-6">
        {conversations.length > 0 ? (
          <Card className="bg-white shadow-md overflow-hidden">
            <div className="divide-y divide-gray-100">
              {conversations.map(conversation => (
                <div 
                  key={conversation.id}
                  className="p-4 flex items-start gap-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => navigate(`/chat/${conversation.id}`)}
                >
                  <Avatar 
                    src={getConversationAvatar(conversation)}
                    alt={getConversationName(conversation)}
                    size="md"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-medium truncate">{getConversationName(conversation)}</h3>
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(conversation.updated_at)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm truncate">
                      {conversation.is_support 
                        ? 'Clique para falar com o suporte'
                        : 'Conversa com a loja'
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            <ListEmptyState
              title="Nenhuma conversa"
              description="Você ainda não tem conversas ativas."
              icon={<MessageSquare size={40} />}
            />
            
            <Card className="p-4 text-center">
              <h3 className="font-medium mb-2">Precisa de ajuda?</h3>
              <p className="text-gray-600 text-sm mb-4">
                Inicie uma conversa com nosso suporte
              </p>
              <Button 
                onClick={handleStartSupportChat}
                className="bg-construPro-blue hover:bg-construPro-blue/90"
              >
                <MessageSquare size={18} className="mr-2" />
                Falar com suporte
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatScreen;
