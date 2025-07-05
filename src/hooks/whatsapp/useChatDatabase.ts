
import { Contact, Message } from '@/types/chat';
import { formatPhoneDisplay } from '@/utils/phoneFormatter';

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
      deals: [],
      tags: [],
      // ATUALIZADO: Usar nome formatado para avatar quando não há nome
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(lead.name || formatPhoneDisplay(lead.phone))}&background=10b981&color=fff`
    };
  };

  const mapDbMessageToMessage = (dbMessage: any): Message => {
    return {
      id: dbMessage.id,
      text: dbMessage.text || '',
      fromMe: dbMessage.from_me,
      timestamp: dbMessage.timestamp,
      status: normalizeStatus(dbMessage.status),
      mediaType: normalizeMediaType(dbMessage.media_type),
      mediaUrl: dbMessage.media_url,
      // Compatibility fields for UI components
      sender: dbMessage.from_me ? 'user' : 'contact',
      time: new Date(dbMessage.timestamp).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      isIncoming: !dbMessage.from_me
    };
  };

  const normalizeStatus = (status: string | null): "sent" | "delivered" | "read" => {
    if (status === 'delivered') return 'delivered';
    if (status === 'read') return 'read';
    return 'sent';
  };

  const normalizeMediaType = (mediaType: string | null): "text" | "image" | "video" | "audio" | "document" => {
    if (mediaType === 'image') return 'image';
    if (mediaType === 'video') return 'video';
    if (mediaType === 'audio') return 'audio';
    if (mediaType === 'document') return 'document';
    return 'text';
  };

  return {
    mapLeadToContact,
    mapDbMessageToMessage
  };
};
