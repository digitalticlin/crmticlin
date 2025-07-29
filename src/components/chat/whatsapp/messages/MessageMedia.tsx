import React from 'react';
import { ImageMessage } from './renderers/ImageMessage';
import { VideoMessage } from './renderers/VideoMessage';
import { AudioMessage } from './renderers/AudioMessage';
import { DocumentMessage } from './renderers/DocumentMessage';
import { cn } from '@/lib/utils';

interface MessageMediaProps {
  messageId: string;
  mediaType: 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
  fileName?: string;
  isIncoming?: boolean;
  className?: string; // Added className prop
  mediaCache?: {
    id: string;
    base64_data?: string | null;
    original_url?: string | null;
    file_size?: number | null;
    media_type?: string | null;
  } | null;
}

// Helper function for MIME type detection
const getMimeType = (mediaType: string, mediaCache?: any, mediaUrl?: string): string => {
  if (mediaUrl) {
    if (mediaUrl.startsWith('data:')) {
      const mimeMatch = mediaUrl.match(/data:([^;]+);/);
      if (mimeMatch) {
        return mimeMatch[1];
      }
    }
    
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
  
  if (mediaCache?.media_type) {
    const mimeMap: Record<string, string> = {
      'image': 'image/jpeg',
      'video': 'video/mp4', 
      'audio': 'audio/ogg',
      'document': 'application/pdf'
    };
    return mimeMap[mediaCache.media_type] || 'application/octet-stream';
  }
  
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
  className,
  mediaCache
}) => {
  const finalUrl = React.useMemo(() => {
    if (mediaUrl?.startsWith('data:')) {
      return mediaUrl;
    }
    
    if (mediaCache?.base64_data) {
      const mimeType = getMimeType(mediaType, mediaCache, mediaUrl);
      const dataUrl = `data:${mimeType};base64,${mediaCache.base64_data}`;
      return dataUrl;
    }
    
    const fallbackUrl = mediaCache?.original_url || mediaUrl;
    if (fallbackUrl) {
      return fallbackUrl;
    }
    
    return null;
  }, [messageId, mediaUrl, mediaCache, mediaType]);

  if (!finalUrl) {
    return (
      <div className={cn("p-3 bg-gray-50 rounded-lg border border-gray-200", className)}>
        <span className="text-sm text-gray-500">
          📎 Mídia não disponível
        </span>
      </div>
    );
  }

  const commonProps = {
    messageId,
    url: finalUrl,
    isIncoming,
    isLoading: false,
    className
  };

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
      return (
        <div className={cn("p-3 bg-gray-50 rounded-lg border border-gray-200", className)}>
          <span className="text-sm text-gray-500">
            📎 Tipo não suportado: {mediaType}
          </span>
        </div>
      );
  }
});

MessageMedia.displayName = 'MessageMedia';
