
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types/chat';

interface UseWhatsAppChatByPhoneProps {
  phone: string;
  enabled?: boolean;
}

export const useWhatsAppChatByPhone = ({ 
  phone, 
  enabled = true 
}: UseWhatsAppChatByPhoneProps) => {
  return useQuery({
    queryKey: ['whatsapp-chat-by-phone', phone],
    queryFn: async (): Promise<Message[]> => {
      if (!phone) {
        throw new Error('Telefone deve ser fornecido');
      }

      // Limpar telefone (só números)
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      console.log('[WhatsApp Chat by Phone] 🔍 Buscando mensagens para telefone:', cleanPhone);

      // Buscar lead pelo telefone
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('id, name, phone')
        .eq('phone', cleanPhone)
        .single();

      if (leadError || !leadData) {
        console.warn('[WhatsApp Chat by Phone] ⚠️ Lead não encontrado:', leadError);
        return [];
      }

      console.log('[WhatsApp Chat by Phone] ✅ Lead encontrado:', leadData);

      // Buscar mensagens do lead com media_cache
      const { data: messagesData, error: messagesError } = await supabase
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
        .eq('lead_id', leadData.id)
        .order('timestamp', { ascending: true });

      if (messagesError) {
        console.error('[WhatsApp Chat by Phone] ❌ Erro ao buscar mensagens:', messagesError);
        throw messagesError;
      }

      console.log('[WhatsApp Chat by Phone] 📨 Mensagens encontradas:', messagesData?.length || 0);

      // Transformar mensagens
      const messages: Message[] = messagesData?.map((msg) => {
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
          media_cache: mediaCache,
          hasMediaCache: !!mediaCache,
          mediaCacheId: mediaCache?.id || null,
          fileName: mediaCache?.file_name || undefined
        };

        // Log para mensagens com mídia
        if (msg.media_type !== 'text') {
          console.log(`[Phone Chat] 📎 ${msg.media_type}: ${msg.id.substring(0, 8)} - Cache: ${!!mediaCache}`);
        }

        return transformedMessage;
      }) || [];

      return messages;
    },
    enabled: enabled && !!phone,
    refetchInterval: 5000, // Atualizar a cada 5 segundos para chat ativo
    staleTime: 2000
  });
};
