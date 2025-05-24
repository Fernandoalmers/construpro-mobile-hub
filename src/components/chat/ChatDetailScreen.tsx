
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Avatar from '../common/Avatar';
import LoadingState from '../common/LoadingState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Image, Paperclip, Mic } from 'lucide-react';
import { chatService, ChatMessage, ChatConversation } from '@/services/chatService';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/context/AuthContext';

const ChatDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      loadConversationData();
    }
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversationData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      
      // Buscar conversas do usuário para encontrar a conversa específica
      const conversations = await chatService.getConversations();
      const currentConversation = conversations.find(conv => conv.id === id);
      
      if (!currentConversation) {
        toast.error('Conversa não encontrada');
        navigate('/chat');
        return;
      }

      setConversation(currentConversation);

      // Carregar mensagens
      const messagesData = await chatService.getMessages(id);
      setMessages(messagesData);
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast.error('Erro ao carregar conversa');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !id || sending) return;
    
    try {
      setSending(true);
      const newMessage = await chatService.sendMessage(id, message.trim());
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getConversationName = () => {
    if (!conversation) return 'Conversa';
    if (conversation.is_support) {
      return 'Suporte ConstruPro+';
    }
    return conversation.store?.nome || 'Loja desconhecida';
  };

  const getConversationAvatar = () => {
    if (!conversation) return '';
    if (conversation.is_support) {
      return 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=150&h=150&fit=crop&q=80';
    }
    return conversation.store?.logo_url || 'https://via.placeholder.com/150';
  };

  if (loading) {
    return <LoadingState text="Carregando conversa..." />;
  }

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-gray-500 mb-4">Conversa não encontrada</p>
        <Button onClick={() => navigate('/chat')}>
          Voltar para conversas
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white p-4 flex items-center shadow-sm">
        <button onClick={() => navigate('/chat')} className="mr-4">
          <ArrowLeft size={24} />
        </button>
        
        <Avatar 
          src={getConversationAvatar()}
          alt={getConversationName()}
          size="sm"
          className="mr-3"
        />
        
        <div className="flex-1 min-w-0">
          <h1 className="font-bold truncate">{getConversationName()}</h1>
          <p className="text-xs text-gray-500">
            {conversation.is_support ? 'Suporte técnico' : 'Loja parceira'}
          </p>
        </div>
      </div>
      
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Send size={24} className="text-gray-400" />
            </div>
            <p>Envie uma mensagem para iniciar a conversa</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUserMessage = msg.sender_id === user?.id;
            
            return (
              <div 
                key={msg.id} 
                className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-t-2xl ${
                    isUserMessage 
                      ? 'bg-construPro-blue text-white rounded-bl-2xl rounded-br-sm' 
                      : 'bg-white text-gray-800 rounded-br-2xl rounded-bl-sm shadow'
                  } p-3`}
                >
                  <p>{msg.message}</p>
                  <div 
                    className={`text-xs mt-1 ${isUserMessage ? 'text-blue-100' : 'text-gray-500'}`}
                  >
                    {formatMessageTime(msg.created_at)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <div className="bg-white p-4">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <div className="flex gap-2">
            <Button type="button" size="icon" variant="ghost" className="text-gray-500">
              <Image size={20} />
            </Button>
            <Button type="button" size="icon" variant="ghost" className="text-gray-500">
              <Paperclip size={20} />
            </Button>
          </div>
          
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1"
            disabled={sending}
          />
          
          <Button
            type={message.trim() ? "submit" : "button"}
            variant={message.trim() ? "default" : "ghost"}
            size="icon"
            className={message.trim() ? "bg-construPro-orange hover:bg-orange-600" : "text-gray-500"}
            disabled={sending}
          >
            {message.trim() ? <Send size={18} /> : <Mic size={20} />}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatDetailScreen;
