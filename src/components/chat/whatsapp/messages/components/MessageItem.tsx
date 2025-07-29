
import React, { memo } from 'react';
import { Message } from '@/types/chat';
import { cn } from '@/lib/utils';
import { MessageMedia } from './MessageMedia';

interface MessageItemProps {
  message: Message;
  isNewMessage?: boolean;
}

export const MessageItem = memo(({ 
  message, 
  isNewMessage = false 
}: MessageItemProps) => {
  const isIncoming = message.isIncoming;
  const hasMedia = message.mediaType && message.mediaType !== 'text';

  return (
    <div
      className={cn(
        "flex mb-3 animate-in fade-in-0 slide-in-from-bottom-1",
        isIncoming ? "justify-start" : "justify-end",
        isNewMessage && "duration-300"
      )}
    >
      <div
        className={cn(
          "max-w-[70%] rounded-lg p-3 shadow-sm",
          isIncoming
            ? "bg-white dark:bg-gray-800 rounded-tl-none"
            : "bg-primary text-primary-foreground rounded-tr-none"
        )}
      >
        {/* Renderizar mídia se existir */}
        {hasMedia && (
          <MessageMedia
            mediaType={message.mediaType}
            mediaUrl={message.mediaUrl}
            mediaCache={message.media_cache}
            fileName={message.media_cache?.file_name}
            isIncoming={isIncoming}
          />
        )}

        {/* Renderizar texto se existir */}
        {message.text && (
          <p className={cn(
            "text-sm leading-relaxed",
            hasMedia && "mt-2"
          )}>
            {message.text}
          </p>
        )}

        {/* Timestamp e status */}
        <div className={cn(
          "flex items-center justify-end mt-1 text-xs gap-1",
          isIncoming 
            ? "text-gray-500 dark:text-gray-400" 
            : "text-primary-foreground/70"
        )}>
          <span>{message.time}</span>
          {!isIncoming && message.status && (
            <span className="text-xs">
              {message.status === "sent" && "✓"}
              {message.status === "delivered" && "✓✓"}
              {message.status === "read" && "✓✓"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Comparação otimizada para evitar re-renders desnecessários
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.text === nextProps.message.text &&
    prevProps.message.status === nextProps.message.status &&
    prevProps.message.mediaUrl === nextProps.message.mediaUrl &&
    prevProps.isNewMessage === nextProps.isNewMessage
  );
});

MessageItem.displayName = 'MessageItem';
