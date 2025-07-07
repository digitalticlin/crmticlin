
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WhatsAppMessagesList } from './WhatsAppMessagesList';
import { WhatsAppMessageInput } from './WhatsAppMessageInput';
import { WhatsAppChatHeader } from './WhatsAppChatHeader';
import { LeadDetailsSidebar } from './LeadDetailsSidebar';
import { Contact, Message } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { useMessageRealtime } from '@/hooks/whatsapp/chat/hooks/useMessageRealtime';
import { useUnreadMessageSync } from '@/hooks/chat/useUnreadMessageSync';
import { toast } from 'sonner';

interface WhatsAppChatAreaProps {
  selectedContact: Contact | null;
  activeInstance: WhatsAppWebInstance | null;
  onContactUpdate?: () => void;
}

export const WhatsAppChatArea = React.memo(({ 
  selectedContact, 
  activeInstance,
  onContactUpdate 
}: WhatsAppChatAreaProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const queryClient = useQueryClient();

  // Função para refetch das mensagens
  const handleMessageUpdate = useCallback(() => {
    if (selectedContact?.id) {
      queryClient.invalidateQueries({
        queryKey: ['whatsapp-messages', selectedContact.id]
      });
    }
    if (onContactUpdate) {
      onContactUpdate();
    }
  }, [selectedContact?.id, queryClient, onContactUpdate]);

  // Hook de sincronização de mensagens não lidas
  const { markContactAsRead } = useUnreadMessageSync({
    selectedContact,
    isActive: !!selectedContact && !isSidebarOpen, // Chat ativo quando contato selecionado e sidebar fechada
    onSyncComplete: onContactUpdate // Atualizar lista de contatos quando marcar como lida
  });

  // Configurar realtime para mensagens
  useMessageRealtime({
    selectedContact,
    activeInstance,
    onMessageUpdate: handleMessageUpdate
  });

  // Query para buscar mensagens
  const { data: messages = [], isLoading, error, refetch } = useQuery({
    queryKey: ['whatsapp-messages', selectedContact?.id],
    queryFn: async () => {
      if (!selectedContact?.id) return [];
      
      console.log('[WhatsAppChatArea] Buscando mensagens para:', selectedContact.name);
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', selectedContact.id)
        .order('timestamp', { ascending: true })
        .limit(100);

      if (error) {
        console.error('[WhatsAppChatArea] Erro ao buscar mensagens:', error);
        throw error;
      }

      return (data || []).map((msg): Message => ({
        id: msg.id,
        text: msg.text || '',
        fromMe: msg.from_me || false,
        timestamp: msg.timestamp || new Date().toISOString(),
        status: msg.status || 'sent',
        mediaType: msg.media_type || 'text',
        mediaUrl: msg.media_url,
        isIncoming: !msg.from_me,
        sender: msg.from_me ? 'user' : 'contact',
        time: new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        })
      }));
    },
    enabled: !!selectedContact?.id,
    staleTime: 30000,
    refetchOnWindowFocus: true
  });

  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!selectedContact || !activeInstance || !messageText.trim()) {
      console.warn('[WhatsAppChatArea] Dados insuficientes para enviar mensagem');
      return;
    }

    try {
      console.log('[WhatsAppChatArea] Enviando mensagem:', {
        to: selectedContact.phone,
        instance: activeInstance.instance_name,
        text: messageText.substring(0, 50) + '...'
      });

      const { error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          instanceId: activeInstance.id,
          to: selectedContact.phone,
          message: messageText
        }
      });

      if (error) throw error;

      toast.success('Mensagem enviada!');
      
      // Refetch messages após envio bem sucedido
      setTimeout(() => {
        refetch();
        if (onContactUpdate) onContactUpdate();
      }, 1000);

    } catch (error) {
      console.error('[WhatsAppChatArea] Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    }
  }, [selectedContact, activeInstance, refetch, onContactUpdate]);

  // Se não há contato selecionado, mostrar estado vazio
  if (!selectedContact) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <div className="mb-4 text-6xl">💬</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Selecione uma conversa
          </h3>
          <p className="text-gray-600">
            Escolha um contato da lista para começar a conversa
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Área principal do chat */}
      <div className="flex-1 flex flex-col">
        {/* Header do chat */}
        <WhatsAppChatHeader 
          contact={selectedContact}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Lista de mensagens */}
        <div className="flex-1 overflow-hidden">
          <WhatsAppMessagesList 
            messages={messages}
            isLoading={isLoading}
            error={error}
          />
        </div>

        {/* Input de mensagem */}
        <WhatsAppMessageInput 
          onSendMessage={handleSendMessage}
          disabled={!activeInstance || activeInstance.connection_status !== 'connected'}
        />
      </div>

      {/* Sidebar de detalhes do lead */}
      {isSidebarOpen && (
        <LeadDetailsSidebar 
          contact={selectedContact}
          onClose={() => setIsSidebarOpen(false)}
          onContactUpdate={onContactUpdate}
        />
      )}
    </div>
  );
});

WhatsAppChatArea.displayName = 'WhatsAppChatArea';
