import React from 'react';
import { ImageMessage } from './renderers/ImageMessage';
import { VideoMessage } from './renderers/VideoMessage';
import { AudioMessage } from './renderers/AudioMessage';
import { DocumentMessage } from './renderers/DocumentMessage';
import { cn } from '@/lib/utils';

interface MessageMediaDirectProps {
  messageId: string;
  mediaType: 'image' | 'video' | 'audio' | 'document';
  mediaUrl: string; // SEMPRE presente - vem de messages.media_url
  fileName?: string;
  isIncoming?: boolean;
  className?: string;
}

/**
 * 🚀 COMPONENTE DIRETO PARA MÍDIA
 * Usado quando messages.media_url já está presente (corrigido pelo webhook)
 * Renderização IMEDIATA sem loading states ou hooks complexos
 */
export const MessageMediaDirect: React.FC<MessageMediaDirectProps> = React.memo(({
  messageId,
  mediaType,
  mediaUrl,
  fileName,
  isIncoming = true,
  className
}) => {
  console.log(`[MessageMediaDirect] 🚀 Renderizando mídia diretamente: ${messageId.substring(0, 8)}`, {
    mediaType,
    urlType: mediaUrl.startsWith('data:') ? 'base64' : 'storage',
    urlPreview: mediaUrl.substring(0, 50) + '...'
  });

  const commonProps = {
    messageId,
    url: mediaUrl,
    isIncoming,
    isLoading: false, // Sempre false - dados já disponíveis
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

MessageMediaDirect.displayName = 'MessageMediaDirect';