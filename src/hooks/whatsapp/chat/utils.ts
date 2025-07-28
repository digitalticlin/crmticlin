
/**
 * Normaliza o tipo de mídia para garantir compatibilidade
 * com os tipos esperados pelo sistema
 */
export function normalizeMediaType(mediaType: string | undefined): 'text' | 'image' | 'video' | 'audio' | 'document' {
  if (!mediaType) return 'text';
  
  const type = mediaType.toLowerCase();
  
  // Mapear tipos comuns para os tipos esperados
  if (type.includes('image') || type === 'photo') return 'image';
  if (type.includes('video')) return 'video';
  if (type.includes('audio') || type === 'voice') return 'audio';
  if (type.includes('document') || type === 'file') return 'document';
  
  return 'text';
}

/**
 * Normaliza o status da mensagem para garantir compatibilidade
 * com os tipos esperados pelo sistema
 */
export function normalizeStatus(status: string | undefined): 'sending' | 'sent' | 'delivered' | 'read' | 'failed' {
  if (!status) return 'sending';
  
  const statusLower = status.toLowerCase();
  
  // Mapear status comuns para os tipos esperados
  if (statusLower.includes('sending') || statusLower === 'enviando') return 'sending';
  if (statusLower.includes('sent') || statusLower === 'enviada') return 'sent';
  if (statusLower.includes('delivered') || statusLower === 'entregue') return 'delivered';
  if (statusLower.includes('read') || statusLower === 'lida') return 'read';
  if (statusLower.includes('failed') || statusLower === 'erro') return 'failed';
  
  return 'sending';
}
