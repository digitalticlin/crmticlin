
import { Message } from '@/types/chat';

export const mapDbMessageToMessage = (dbMessage: any): Message => {
  return {
    id: dbMessage.id,
    text: dbMessage.text || '',
    fromMe: dbMessage.from_me,
    timestamp: dbMessage.timestamp,
    status: normalizeStatus(dbMessage.status),
    mediaType: normalizeMediaType(dbMessage.media_type),
    mediaUrl: dbMessage.media_url,
    // Campos de compatibilidade para componentes de UI
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
