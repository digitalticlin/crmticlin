
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types/chat';

interface UseWhatsAppChatMessagesProps {
  leadId?: string;
  instanceId?: string;
  enabled?: boolean;
}

export const useWhatsAppChatMessages = ({ 
  leadId, 
  instanceId, 
  enabled = true 
}: UseWhatsAppChatMessagesProps) => {
  return useQuery({
    queryKey: ['whatsapp-chat-messages', leadId, instanceId],
    queryFn: async (): Promise<Message[]> => {
      if (!leadId && !instanceId) {
        throw new Error('leadId ou instanceId deve ser fornecido');
      }

      console.log('[WhatsApp Messages] 🔍 Buscando mensagens:', { leadId, instanceId });

      // ✅ QUERY CORRIGIDA - sem 'updated_at' que não existe
      let query = supabase
        .from('messages')
        .select(`
          id,
          text,
          from_me,
          timestamp,
          status,
          media_type,
          media_url,
          external_message_id,
          created_at,
          media_cache!left(
            id,
            base64_data,
            original_url,
            cached_url,
            file_size,
            media_type,
            file_name
          )
        `)
        .order('timestamp', { ascending: true });

      // Aplicar filtros
      if (leadId) {
        query = query.eq('lead_id', leadId);
      }
      if (instanceId) {
        query = query.eq('whatsapp_number_id', instanceId);
      }

      const { data: messagesData, error } = await query;

      if (error) {
        console.error('[WhatsApp Messages] ❌ Erro na consulta:', error);
        throw error;
      }

      console.log('[WhatsApp Messages] ✅ Mensagens carregadas:', {
        total: messagesData?.length || 0,
        withMedia: messagesData?.filter(m => m.media_type !== 'text').length || 0,
        withCache: messagesData?.filter(m => m.media_cache && m.media_cache.id).length || 0
      });

      // ✅ TRANSFORMAR DADOS PARA INTERFACE
      const messages: Message[] = messagesData.map((msg) => {
        // ✅ CORRIGIDO: media_cache é um objeto único, não array
        let mediaCache = null;
        if (msg.media_cache && msg.media_cache.id) {
          mediaCache = msg.media_cache;
        }

        const transformedMessage: Message = {
          id: msg.id,
          text: msg.text || '',
          sender: msg.from_me ? 'user' : 'contact',
          time: new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          timestamp: msg.timestamp,
          status: msg.status as any,
          isIncoming: !msg.from_me,
          fromMe: msg.from_me,
          mediaType: msg.media_type as any,
          mediaUrl: msg.media_url,
          // ✅ INCLUIR MEDIA_CACHE NA MENSAGEM
          media_cache: mediaCache,
          // ✅ DEBUG: Campos para debugging
          hasMediaCache: !!mediaCache,
          mediaCacheId: mediaCache?.id || null,
          // ✅ FILENAME do cache se disponível
          fileName: mediaCache?.file_name || undefined
        };

        // ✅ LOG DETALHADO PARA MENSAGENS COM MÍDIA
        if (msg.media_type !== 'text') {
          console.log(`[WhatsApp Messages] 📎 Mídia processada:`, {
            id: msg.id.substring(0, 8),
            type: msg.media_type,
            hasUrl: !!msg.media_url,
            hasCache: !!mediaCache,
            cacheHasBase64: !!(mediaCache?.base64_data),
            cacheSize: mediaCache?.file_size || 0,
            fileName: mediaCache?.file_name
          });
        }

        return transformedMessage;
      });

      return messages;
    },
    enabled: enabled && (!!leadId || !!instanceId),
    refetchInterval: 10000, // Refetch a cada 10 segundos
    staleTime: 5000 // Considerar dados obsoletos após 5 segundos
  });
};
