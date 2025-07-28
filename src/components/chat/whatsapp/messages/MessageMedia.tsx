
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

// 🚀 MIMEYPES OTIMIZADOS COM DETECÇÃO INTELIGENTE
const getMimeType = (mediaType: string, mediaCache?: any, mediaUrl?: string): string => {
  // 🎯 DETECÇÃO INTELIGENTE BASEADA NA URL
  if (mediaUrl) {
    // Se é data URL, extrair MIME type da URL
    if (mediaUrl.startsWith('data:')) {
      const mimeMatch = mediaUrl.match(/data:([^;]+);/);
      if (mimeMatch) {
        console.log(`[MessageMedia] 🔍 MIME detectado da URL: ${mimeMatch[1]}`);
        return mimeMatch[1];
      }
    }
    
    // Se é URL de arquivo, detectar pela extensão
    const urlLower = mediaUrl.toLowerCase();
    if (urlLower.includes('.jpg') || urlLower.includes('.jpeg')) {
      return 'image/jpeg';
    } else if (urlLower.includes('.png')) {
      return 'image/png';
    } else if (urlLower.includes('.gif')) {
      return 'image/gif';
    } else if (urlLower.includes('.webp')) {
      return 'image/webp';
    } else if (urlLower.includes('.mp4')) {
      return 'video/mp4';
    } else if (urlLower.includes('.webm')) {
      return 'video/webm';
    } else if (urlLower.includes('.ogg')) {
      return 'audio/ogg';
    } else if (urlLower.includes('.mp3')) {
      return 'audio/mp3';
    } else if (urlLower.includes('.pdf')) {
      return 'application/pdf';
    }
  }
  
  // Se tem cache com media_type específico, usar
  if (mediaCache?.media_type) {
    const mimeMap: Record<string, string> = {
      'image': 'image/jpeg', // Fallback para JPEG
      'video': 'video/mp4', 
      'audio': 'audio/ogg',
      'document': 'application/pdf'
    };
    return mimeMap[mediaCache.media_type] || 'application/octet-stream';
  }
  
  // Fallback baseado no mediaType
  switch (mediaType) {
    case 'image': return 'image/jpeg'; // Padrão JPEG para compatibilidade
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
      const mimeType = getMimeType(mediaType, mediaCache, mediaUrl);
      const dataUrl = `data:${mimeType};base64,${mediaCache.base64_data}`;
      console.log(`[MessageMedia] 💾 Cache convertido para URL: ${messageId.substring(0, 8)} (${mimeType})`);
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

