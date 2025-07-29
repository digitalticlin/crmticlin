
import React from 'react';
import { cn } from '@/lib/utils';
import { ImageMessage } from '../renderers/ImageMessage';
import { VideoMessage } from '../renderers/VideoMessage';
import { AudioMessage } from '../renderers/AudioMessage';
import { DocumentMessage } from '../renderers/DocumentMessage';

interface MessageMediaProps {
  messageId: string;
  mediaType?: string;
  mediaUrl?: string;
  mediaCache?: any;
  fileName?: string;
  isIncoming: boolean;
  className?: string;
}

export const MessageMedia: React.FC<MessageMediaProps> = ({
  messageId,
  mediaType,
  mediaUrl,
  mediaCache,
  fileName,
  isIncoming,
  className
}) => {
  if (!mediaType || !mediaUrl) {
    return null;
  }

  const commonProps = {
    messageId,
    url: mediaUrl,
    fileName: fileName || 'arquivo',
    isIncoming,
    className
  };

  switch (mediaType) {
    case 'image':
      return <ImageMessage {...commonProps} />;
    
    case 'video':
      return <VideoMessage {...commonProps} />;
    
    case 'audio':
      return <AudioMessage {...commonProps} />;
    
    case 'document':
      return <DocumentMessage {...commonProps} filename={fileName || 'arquivo'} />;
    
    default:
      return (
        <div className={cn(
          "flex items-center gap-2 p-2 rounded bg-gray-100 dark:bg-gray-800",
          className
        )}>
          <span className="text-sm text-muted-foreground">
            Tipo de mídia não suportado: {mediaType}
          </span>
        </div>
      );
  }
};
