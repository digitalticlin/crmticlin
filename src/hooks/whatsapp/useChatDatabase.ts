
import { Contact, Message } from '@/types/chat';
import { formatPhoneDisplay } from '@/utils/phoneFormatter';
import { normalizeStatus, normalizeMediaType } from './chat/utils';

export const useChatDatabase = () => {
  const mapLeadToContact = (lead: any): Contact => {
    return {
      id: lead.id,
      // ATUALIZADO: Não usar telefone bruto como fallback do nome
      name: lead.name || null,
      phone: lead.phone,
      email: lead.email,
      address: lead.address,
      company: lead.company,
      documentId: lead.document_id,
      notes: lead.notes,
      lastMessage: lead.last_message,
      lastMessageTime: lead.last_message_time,
      // CORREÇÃO: Garantir que zero não seja exibido
      unreadCount: lead.unread_count && lead.unread_count > 0 ? lead.unread_count : undefined,
      createdAt: lead.created_at,
      assignedUser: lead.owner_id,
      purchaseValue: lead.purchase_value,
      stageId: lead.kanban_stage_id || null, // ✅ CORREÇÃO SEGURA: Garantir que seja null se não houver
      deals: [],
      tags: [],
      // ATUALIZADO: Usar nome formatado para avatar quando não há nome
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(lead.name || formatPhoneDisplay(lead.phone))}&background=10b981&color=fff`
    };
  };

  const mapDbMessageToMessage = (dbMessage: any): Message => {
    // ✅ CORRIGIDO: Incluir media_cache no mapeamento
    const mediaCacheData = dbMessage.media_cache && dbMessage.media_cache.length > 0 
      ? dbMessage.media_cache[0] 
      : null;

    // ✅ FALLBACK: Para mensagens de mídia sem cache, tentar usar media_url
    const isMediaMessage = dbMessage.media_type && dbMessage.media_type !== 'text';
    const hasValidMediaUrl = dbMessage.media_url && 
                            (dbMessage.media_url.startsWith('http') || dbMessage.media_url.startsWith('data:'));

    console.log(`[mapDbMessageToMessage] 🔄 Mapeando mensagem ${dbMessage.id}:`, {
      mediaType: dbMessage.media_type,
      hasMediaUrl: !!dbMessage.media_url,
      hasMediaCache: !!mediaCacheData,
      isMediaMessage,
      hasValidMediaUrl,
      mediaCacheKeys: mediaCacheData ? Object.keys(mediaCacheData) : []
    });

    return {
      id: dbMessage.id,
      text: dbMessage.text || '',
      fromMe: dbMessage.from_me,
      timestamp: dbMessage.timestamp,
      status: normalizeStatus(dbMessage.status),
      mediaType: normalizeMediaType(dbMessage.media_type),
      mediaUrl: dbMessage.media_url,
      // ✅ NOVO: Incluir media_cache no objeto Message
      media_cache: mediaCacheData ? {
        id: mediaCacheData.id,
        base64_data: mediaCacheData.base64_data,
        original_url: mediaCacheData.original_url,
        file_size: mediaCacheData.file_size,
        media_type: mediaCacheData.media_type
      } : null,
      // Compatibility fields for UI components
      sender: dbMessage.from_me ? 'user' : 'contact',
      time: new Date(dbMessage.timestamp).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      isIncoming: !dbMessage.from_me
    };
  };



  return {
    mapLeadToContact,
    mapDbMessageToMessage
  };
};
