
import React, { memo } from 'react';
import { Message } from '@/types/chat';
import { cn } from '@/lib/utils';
import { MessageContent } from './MessageContent';
import { MessageMedia } from './MessageMedia';
import { MessageStatus } from './MessageStatus';
import { MessageTimestamp } from './MessageTimestamp';
import { CheckCircle2, XCircle, Clock, User } from 'lucide-react';

interface MessageItemProps {
  message: Message;
  isLastMessage?: boolean;
}

export const MessageItem = memo<MessageItemProps>(({ 
  message, 
  isLastMessage = false 
}) => {
  const isIncoming = message.type === 'incoming';
  const isOptimistic = message.id?.startsWith('temp_');
  
  return (
    <div className={cn(
      "flex mb-3 px-4",
      isIncoming ? "justify-start" : "justify-end"
    )}>
      <div className={cn(
        "max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 py-2 relative",
        isIncoming 
          ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm" 
          : "bg-green-500 text-white rounded-br-sm",
        isOptimistic && "opacity-70"
      )}>
        {/* Contact name for incoming messages in groups */}
        {isIncoming && (
          <div className="flex items-center gap-1 mb-1 text-xs text-gray-500">
            <User className="h-3 w-3" />
            <span>{message.contact?.name || 'Unknown'}</span>
          </div>
        )}

        {/* Media content */}
        {message.mediaType && message.mediaUrl && (
          <MessageMedia
            messageId={message.id}
            mediaType={message.mediaType}
            mediaUrl={message.mediaUrl}
            fileName={message.fileName}
            isIncoming={isIncoming}
            className="mb-2"
          />
        )}

        {/* Text content */}
        {message.content && (
          <MessageContent 
            content={message.content} 
            isIncoming={isIncoming}
          />
        )}

        {/* Optimistic message status */}
        {isOptimistic && (
          <div className="flex items-center gap-1 mt-1">
            <Clock className="h-3 w-3 text-yellow-500" />
            <span className="text-xs text-gray-500">Enviando...</span>
          </div>
        )}

        {/* Message footer */}
        <div className={cn(
          "flex items-center justify-between gap-2 mt-1 text-xs",
          isIncoming ? "text-gray-500" : "text-white/70"
        )}>
          <MessageTimestamp timestamp={message.timestamp} />
          
          {!isIncoming && !isOptimistic && (
            <MessageStatus 
              status={message.status} 
              isLastMessage={isLastMessage}
            />
          )}
        </div>
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';
