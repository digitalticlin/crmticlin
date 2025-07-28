
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
