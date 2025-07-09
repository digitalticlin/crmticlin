
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
}

export const MediaRenderer: React.FC<MediaRendererProps> = ({
  mediaType,
  messageId,
  url,
  fileName,
  isIncoming = true
}) => {
  const mediaProps = {
    messageId,
    url,
    isLoading: false,
    isIncoming
  };

  switch (mediaType) {
    case 'image':
      return <ImageMessage {...mediaProps} />;
    case 'video':
      return <VideoMessage {...mediaProps} caption="" />;
    case 'audio':
      return <AudioMessage {...mediaProps} />;
    case 'document':
      return <DocumentMessage 
        {...mediaProps} 
        filename={fileName || 'Documento'} 
      />;
    default:
      return (
        <div className="p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-500">
            📎 Tipo não suportado: {mediaType}
          </span>
        </div>
      );
  }
};
