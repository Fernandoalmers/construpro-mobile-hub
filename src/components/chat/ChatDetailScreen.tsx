
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Avatar from '../common/Avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Image, Paperclip, Mic } from 'lucide-react';
import mensagens from '../../data/mensagens.json';
import clientes from '../../data/clientes.json';
import lojas from '../../data/lojas.json';

const ChatDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Use the first client as the logged in user for demo
  const currentUser = clientes[0];
  
  // Find the conversation by ID
  const conversation = mensagens.find(chat => chat.id === id);
  
  // Get store info
  let chatName = 'Conversa';
  let chatAvatar = '';
  
  if (conversation) {
    if (conversation.lojaId === 'suporte') {
      chatName = 'Suporte ConstruPro+';
      chatAvatar = 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=150&h=150&fit=crop&q=80';
    } else {
      const loja = lojas.find(l => l.id === conversation.lojaId);
      chatName = loja?.nome || 'Loja desconhecida';
      chatAvatar = loja?.logoUrl || 'https://via.placeholder.com/150';
    }
  }
  
  // Format chat messages
  const chatMessages = conversation?.mensagens || [];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    // In a real app, this would send the message to the backend
    // For now, just clear the input
    setMessage('');
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white p-4 flex items-center shadow-sm">
        <button onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft size={24} />
        </button>
        
        <Avatar 
          src={chatAvatar}
          alt={chatName}
          size="sm"
          className="mr-3"
        />
        
        <div className="flex-1 min-w-0">
          <h1 className="font-bold truncate">{chatName}</h1>
          <p className="text-xs text-gray-500">Online</p>
        </div>
      </div>
      
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Send size={24} className="text-gray-400" />
            </div>
            <p>Envie uma mensagem para iniciar a conversa</p>
          </div>
        ) : (
          chatMessages.map((msg) => {
            const isUserMessage = msg.remetente === 'cliente';
            
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
                  <p>{msg.texto}</p>
                  <div 
                    className={`text-xs mt-1 ${isUserMessage ? 'text-blue-100' : 'text-gray-500'}`}
                  >
                    {formatMessageTime(msg.data)}
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
          />
          
          <Button
            type={message.trim() ? "submit" : "button"}
            variant={message.trim() ? "default" : "ghost"}
            size="icon"
            className={message.trim() ? "bg-construPro-orange hover:bg-orange-600" : "text-gray-500"}
          >
            {message.trim() ? <Send size={18} /> : <Mic size={20} />}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatDetailScreen;
