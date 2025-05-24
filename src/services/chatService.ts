
import { supabase } from '@/integrations/supabase/client';

export interface ChatConversation {
  id: string;
  user_id: string;
  store_id?: string;
  is_support: boolean;
  created_at: string;
  updated_at: string;
  store?: {
    id: string;
    nome: string;
    logo_url?: string;
  };
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  sender_type: 'user' | 'store' | 'support';
  created_at: string;
  read_at?: string;
}

export const chatService = {
  // Buscar conversas do usuário
  async getConversations(): Promise<ChatConversation[]> {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select(`
        *,
        store:stores(id, nome, logo_url)
      `)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }

    return data || [];
  },

  // Buscar mensagens de uma conversa
  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }

    return data || [];
  },

  // Enviar mensagem
  async sendMessage(conversationId: string, message: string): Promise<ChatMessage> {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.user.id,
        message,
        sender_type: 'user'
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }

    return data;
  },

  // Criar ou buscar conversa de suporte
  async getOrCreateSupportConversation(): Promise<ChatConversation> {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      throw new Error('Usuário não autenticado');
    }

    // Tentar buscar conversa de suporte existente
    const { data: existingConversation } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', user.user.id)
      .eq('is_support', true)
      .single();

    if (existingConversation) {
      return existingConversation;
    }

    // Criar nova conversa de suporte se não existir
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: user.user.id,
        is_support: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating support conversation:', error);
      throw error;
    }

    return data;
  },

  // Criar conversa com loja
  async createStoreConversation(storeId: string): Promise<ChatConversation> {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      throw new Error('Usuário não autenticado');
    }

    // Verificar se já existe conversa com esta loja
    const { data: existingConversation } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', user.user.id)
      .eq('store_id', storeId)
      .single();

    if (existingConversation) {
      return existingConversation;
    }

    // Criar nova conversa com a loja
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: user.user.id,
        store_id: storeId,
        is_support: false
      })
      .select(`
        *,
        store:stores(id, nome, logo_url)
      `)
      .single();

    if (error) {
      console.error('Error creating store conversation:', error);
      throw error;
    }

    return data;
  },

  // Marcar mensagem como lida
  async markAsRead(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId);

    if (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }
};
