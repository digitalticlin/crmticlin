
import React, { memo } from 'react';
import { Message } from '@/types/chat';
import { MessageMedia } from './MessageMedia';
import { cn } from '@/lib/utils';

interface MessageItemProps {
  message: Message;
  isNewMessage?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = memo(({
  message,
  isNewMessage = false
}) => {
  const isIncoming = !message.fromMe;
  const hasMedia = message.mediaType !== 'text' && message.mediaUrl;

  return (
    <div
      className={cn(
        "flex mb-3 px-4",
        isIncoming ? "justify-start" : "justify-end"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-3 py-2 relative",
          isIncoming 
            ? "bg-white border border-gray-200 text-gray-900 rounded-tl-none shadow-sm" 
            : "bg-primary text-primary-foreground rounded-tr-none shadow-sm",
          isNewMessage && "animate-fadeIn"
        )}
      >
        {/* Renderizar mídia se existe */}
        {hasMedia && (
          <div className="mb-2">
            <MessageMedia
              mediaUrl={message.mediaUrl!}
              mediaType={message.mediaType || 'text'}
              fileName={message.text || undefined}
            />
          </div>
        )}
        
        {/* Renderizar texto se existe */}
        {message.text && (
          <div className="break-words">
            <p className="text-sm leading-relaxed">{message.text}</p>
          </div>
        )}

        {/* Timestamp e status */}
        <div className={cn(
          "flex items-center justify-end gap-1 mt-1 text-xs",
          isIncoming ? "text-gray-500" : "text-primary-foreground/70"
        )}>
          <span>{message.time}</span>
          {!isIncoming && message.status && (
            <span className="text-xs">
              {message.status === "sent" && "✓"}
              {message.status === "delivered" && "✓✓"}
              {message.status === "read" && (
                <span className="text-blue-400">✓✓</span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';
