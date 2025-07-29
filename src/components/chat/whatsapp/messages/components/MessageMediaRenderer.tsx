
import React from 'react';
import { MessageMedia } from '../MessageMedia';

interface MessageMediaRendererProps {
  message: any;
  className?: string;
}

export const MessageMediaRenderer: React.FC<MessageMediaRendererProps> = ({ 
  message, 
  className 
}) => {
  // Only render if message has media
  if (!message.media_type || message.media_type === 'text') {
    return null;
  }

  return (
    <MessageMedia
      messageId={message.id}
      mediaType={message.media_type}
      mediaUrl={message.media_url}
      fileName={message.file_name}
      isIncoming={message.isIncoming}
      mediaCache={message.media_cache}
      className={className}
    />
  );
};
