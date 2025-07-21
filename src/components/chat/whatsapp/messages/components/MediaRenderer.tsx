
import React from 'react';
import { ImageMessage } from '../renderers/ImageMessage';
import { VideoMessage } from '../renderers/VideoMessage';
import { AudioMessage } from '../renderers/AudioMessage';
import { DocumentMessage } from '../renderers/DocumentMessage';

interface MediaRendererProps {
  mediaType: 'image' | 'video' | 'audio' | 'document';
  messageId: string;
  url: string;
  fileName?: string;
  isIncoming?: boolean;
  isLoading?: boolean;
}

export const MediaRenderer: React.FC<MediaRendererProps> = ({
  mediaType,
  messageId,
  url,
  fileName,
  isIncoming = true,
  isLoading = false
}) => {
  console.log(`[MediaRenderer] 🎬 Renderizando ${mediaType} para ${messageId}:`, {
    url: url?.substring(0, 50) + '...',
    fileName,
    isIncoming,
    isLoading
  });

  const commonProps = {
    messageId,
    url,
    isIncoming,
    isLoading
  };

  switch (mediaType) {
    case 'image':
      return (
        <ImageMessage 
          {...commonProps}
          caption={fileName}
        />
      );
      
    case 'video':
      return (
        <VideoMessage 
          {...commonProps}
          caption={fileName || '[Vídeo]'}
        />
      );
      
    case 'audio':
      return (
        <AudioMessage 
          {...commonProps}
        />
      );
      
    case 'document':
      return (
        <DocumentMessage 
          {...commonProps}
          filename={fileName || 'Documento'}
        />
      );
      
    default:
      console.warn(`[MediaRenderer] ⚠️ Tipo de mídia não suportado: ${mediaType}`);
      return (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <span className="text-sm text-gray-500">
            📎 Tipo não suportado: {mediaType}
          </span>
        </div>
      );
  }
};
