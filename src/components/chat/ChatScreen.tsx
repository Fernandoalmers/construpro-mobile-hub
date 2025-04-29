
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../common/Avatar';
import Card from '../common/Card';
import ListEmptyState from '../common/ListEmptyState';
import { MessageSquare } from 'lucide-react';
import mensagens from '../../data/mensagens.json';
import clientes from '../../data/clientes.json';
import lojas from '../../data/lojas.json';

const ChatScreen: React.FC = () => {
  const navigate = useNavigate();
  // Use the first client as the logged in user for demo
  const currentUser = clientes[0];
  
  // Filter chat conversations for the current user
  const userConversations = mensagens.filter(chat => chat.clienteId === currentUser.id);

  // Add support chat if it doesn't exist
  if (!userConversations.find(chat => chat.lojaId === 'suporte')) {
    const supportChat = {
      id: 'support',
      clienteId: currentUser.id,
      lojaId: 'suporte',
      mensagens: []
    };
    userConversations.push(supportChat);
  }

  // Format the conversations data with store info
  const formattedConversations = userConversations.map(chat => {
    if (chat.lojaId === 'suporte') {
      return {
        id: chat.id,
        nome: 'Suporte ConstruPro+',
        logoUrl: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=150&h=150&fit=crop&q=80',
        lastMessage: chat.mensagens.length > 0 
          ? chat.mensagens[chat.mensagens.length - 1].texto 
          : 'Bem-vindo ao suporte. Como podemos ajudar?',
        lastMessageTime: chat.mensagens.length > 0 
          ? new Date(chat.mensagens[chat.mensagens.length - 1].data) 
          : new Date(),
        unreadCount: 0
      };
    } else {
      const loja = lojas.find(l => l.id === chat.lojaId);
      return {
        id: chat.id,
        nome: loja?.nome || 'Loja desconhecida',
        logoUrl: loja?.logoUrl || 'https://via.placeholder.com/150',
        lastMessage: chat.mensagens.length > 0 
          ? chat.mensagens[chat.mensagens.length - 1].texto 
          : 'Inicie uma conversa',
        lastMessageTime: chat.mensagens.length > 0 
          ? new Date(chat.mensagens[chat.mensagens.length - 1].data) 
          : new Date(),
        unreadCount: Math.floor(Math.random() * 3) // Mock unread count for demo
      };
    }
  });

  // Sort conversations by date (most recent first)
  formattedConversations.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());

  const formatRelativeTime = (date: Date) => {
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

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-construPro-blue p-6 pt-12 rounded-b-3xl">
        <h1 className="text-2xl font-bold text-white">Chat</h1>
      </div>
      
      <div className="p-6 -mt-6">
        {formattedConversations.length > 0 ? (
          <Card className="bg-white shadow-md overflow-hidden">
            <div className="divide-y divide-gray-100">
              {formattedConversations.map(chat => (
                <div 
                  key={chat.id}
                  className="p-4 flex items-start gap-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => navigate(`/chat/${chat.id}`)}
                >
                  <Avatar 
                    src={chat.logoUrl}
                    alt={chat.nome}
                    size="md"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-medium truncate">{chat.nome}</h3>
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(chat.lastMessageTime)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm truncate">
                      {chat.lastMessage}
                    </p>
                  </div>
                  
                  {chat.unreadCount > 0 && (
                    <div className="bg-construPro-orange text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {chat.unreadCount}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <ListEmptyState
            title="Nenhuma conversa"
            description="Inicie uma conversa com uma loja ou com o suporte."
            icon={<MessageSquare size={40} />}
          />
        )}
      </div>
    </div>
  );
};

export default ChatScreen;
