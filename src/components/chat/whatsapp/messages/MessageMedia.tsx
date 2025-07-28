
import React from 'react';
import { ImageMessage } from './renderers/ImageMessage';
import { VideoMessage } from './renderers/VideoMessage';
import { AudioMessage } from './renderers/AudioMessage';
import { DocumentMessage } from './renderers/DocumentMessage';

interface MessageMediaProps {
  messageId: string;
  mediaType: 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
  fileName?: string;
  isIncoming?: boolean;
  mediaCache?: {
    id: string;
    base64_data?: string | null;
    original_url?: string | null;
    file_size?: number | null;
    media_type?: string | null;
  } | null;
}

// 🚀 MIMEYPES OTIMIZADOS
const getMimeType = (mediaType: string, mediaCache?: any): string => {
  // Se tem cache com media_type específico, usar
  if (mediaCache?.media_type) {
    const mimeMap: Record<string, string> = {
      'image': 'image/jpeg',
      'video': 'video/mp4', 
      'audio': 'audio/ogg',
      'document': 'application/pdf'
    };
    return mimeMap[mediaCache.media_type] || 'application/octet-stream';
  }
  
  // Fallback baseado no mediaType
  switch (mediaType) {
    case 'image': return 'image/jpeg';
    case 'video': return 'video/mp4';
    case 'audio': return 'audio/ogg';
    case 'document': return 'application/pdf';
    default: return 'application/octet-stream';
  }
};

export const MessageMedia: React.FC<MessageMediaProps> = React.memo(({
  messageId,
  mediaType,
  mediaUrl,
  fileName,
  isIncoming = true,
  mediaCache
}) => {
  // 🚀 RENDERIZAÇÃO IMEDIATA: Determinar URL final INSTANTANEAMENTE
  const finalUrl = React.useMemo(() => {
    // PRIORIDADE 1: URL já é data URL
    if (mediaUrl?.startsWith('data:')) {
      console.log(`[MessageMedia] ⚡ URL base64 imediata: ${messageId.substring(0, 8)}`);
      return mediaUrl;
    }
    
    // PRIORIDADE 2: Base64 do cache
    if (mediaCache?.base64_data) {
      const mimeType = getMimeType(mediaType, mediaCache);
      const dataUrl = `data:${mimeType};base64,${mediaCache.base64_data}`;
      console.log(`[MessageMedia] 💾 Cache convertido para URL: ${messageId.substring(0, 8)}`);
      return dataUrl;
    }
    
    // PRIORIDADE 3: URL original/cached
    const fallbackUrl = mediaCache?.original_url || mediaUrl;
    if (fallbackUrl) {
      console.log(`[MessageMedia] 🔗 URL fallback: ${messageId.substring(0, 8)}`);
      return fallbackUrl;
    }
    
    console.warn(`[MessageMedia] ❌ Nenhuma URL disponível: ${messageId.substring(0, 8)}`);
    return null;
  }, [messageId, mediaUrl, mediaCache, mediaType]);

  // 🚀 EARLY RETURN: Se não há URL, não renderizar
  if (!finalUrl) {
    console.warn(`[MessageMedia] ⚠️ Mídia sem URL válida: ${messageId}`);
    return (
      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
        <span className="text-sm text-gray-500">
          📎 Mídia não disponível
        </span>
      </div>
    );
  }

  // 🚀 RENDERIZAÇÃO DIRETA: Props comuns
  const commonProps = {
    messageId,
    url: finalUrl,
    isIncoming,
    isLoading: false
  };

  console.log(`[MessageMedia] 🎬 Renderizando ${mediaType}: ${messageId.substring(0, 8)}`);

  // 🚀 SWITCH SIMPLES E DIRETO
  switch (mediaType) {
    case 'image':
      return <ImageMessage {...commonProps} />;
      
    case 'video':
      return <VideoMessage {...commonProps} caption="" />;
      
    case 'audio':
      return <AudioMessage {...commonProps} />;
      
    case 'document':
      return (
        <DocumentMessage 
          {...commonProps}
          filename={fileName || 'Documento'}
          caption={fileName}
        />
      );
      
    default:
      console.warn(`[MessageMedia] ⚠️ Tipo não suportado: ${mediaType}`);
      return (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <span className="text-sm text-gray-500">
            📎 Tipo não suportado: {mediaType}
          </span>
        </div>
      );
  }
});

MessageMedia.displayName = 'MessageMedia';

