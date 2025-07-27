
import { Message } from '@/types/chat';

export const mapDbMessageToMessage = (dbMessage: any): Message => {
  // 🔧 CORREÇÃO: Buscar dados de mídia do media_cache se não existir na mensagem
  let mediaType = dbMessage.media_type;
  let mediaUrl = dbMessage.media_url;

  // Se a mensagem não tem mídia definida mas tem cache associado, usar os dados do cache
  if (!mediaType && dbMessage.media_cache && dbMessage.media_cache.length > 0) {
    const cache = dbMessage.media_cache[0];
    mediaType = cache.media_type;
    
    // Priorizar URL do storage, depois base64, depois original
    if (cache.cached_url) {
      mediaUrl = cache.cached_url;
    } else if (cache.base64_data) {
      // Criar data URL com MIME type correto baseado no tipo de mídia
      const mimeTypes = {
        'image': 'image/jpeg',
        'audio': 'audio/ogg',
        'video': 'video/mp4',
        'document': 'application/pdf'
      };
      const mimeType = mimeTypes[cache.media_type as keyof typeof mimeTypes] || 'application/octet-stream';
      mediaUrl = `data:${mimeType};base64,${cache.base64_data}`;
    } else if (cache.original_url) {
      mediaUrl = cache.original_url;
    }
  }

  return {
    id: dbMessage.id,
    text: dbMessage.text || '',
    fromMe: dbMessage.from_me,
    timestamp: dbMessage.timestamp,
    status: normalizeStatus(dbMessage.status),
    mediaType: normalizeMediaType(mediaType),
    mediaUrl: mediaUrl,
    // ✅ CORRIGIDO: Incluir media_cache completo para o frontend
    media_cache: dbMessage.media_cache?.[0] || null,
    // Campos adicionais para debugging
    hasMediaCache: !!(dbMessage.media_cache && dbMessage.media_cache.length > 0),
    mediaCacheId: dbMessage.media_cache?.[0]?.id,
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
