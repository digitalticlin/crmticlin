
import React from 'react';
import { ImageMessage } from './renderers/ImageMessage';
import { VideoMessage } from './renderers/VideoMessage';
import { AudioMessage } from './renderers/AudioMessage';
import { DocumentMessage } from './renderers/DocumentMessage';
import { MediaLoadingState } from './components/MediaLoadingState';
import { MediaErrorState } from './components/MediaErrorState';
import { cn } from '@/lib/utils';
import { useMediaLoaderEnhanced } from './hooks/useMediaLoaderEnhanced';

interface MessageMediaEnhancedProps {
  messageId: string;
  mediaType: 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
  fileName?: string;
  isIncoming?: boolean;
  className?: string;
  mediaCache?: {
    id: string;
    base64_data?: string | null;
    original_url?: string | null;
    cached_url?: string | null;
    file_size?: number | null;
    media_type?: string | null;
  } | null;
}

export const MessageMediaEnhanced: React.FC<MessageMediaEnhancedProps> = React.memo(({
  messageId,
  mediaType,
  mediaUrl,
  fileName,
  isIncoming = true,
  className,
  mediaCache
}) => {
  const { 
    finalUrl, 
    isLoading, 
    error, 
    canRetry, 
    retry, 
    mediaStatus 
  } = useMediaLoaderEnhanced({
    messageId,
    mediaType,
    mediaUrl,
    mediaCache
  });

  // ✅ ESTADO DE CARREGAMENTO
  if (isLoading) {
    return (
      <div className={cn("p-2", className)}>
        <MediaLoadingState mediaType={mediaType} />
      </div>
    );
  }

  // ✅ ESTADO DE ERRO
  if (error || !finalUrl) {
    return (
      <div className={cn("p-2", className)}>
        <MediaErrorState 
          error={error || 'Mídia não encontrada'}
          mediaType={mediaType}
          onRetry={canRetry ? retry : undefined}
        />
      </div>
    );
  }

  // ✅ RENDERIZAR MÍDIA BASEADA NO TIPO
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

MessageMediaEnhanced.displayName = 'MessageMediaEnhanced';
