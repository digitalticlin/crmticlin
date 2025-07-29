
import React, { memo } from 'react';
import { Message } from '@/types/chat';
import { cn } from '@/lib/utils';
import { MessageMedia } from './MessageMedia';
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';

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

  // Render status icon with better visibility
  const renderStatusIcon = () => {
    if (isIncoming) return null;
    
    switch (message.status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-white/60 animate-spin" />;
      case 'sent':
        return <Check className="h-3 w-3 text-white/70" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-white/70" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-green-400" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-red-400" />;
      default:
        return <Check className="h-3 w-3 text-white/70" />;
    }
  };

  return (
    <div
      className={cn(
        "flex mb-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
        isIncoming ? "justify-start" : "justify-end",
        isNewMessage && "duration-500"
      )}
    >
      <div
        className={cn(
          "group relative max-w-[75%] rounded-2xl shadow-glass border backdrop-blur-md transition-all duration-200 hover:shadow-lg",
          isIncoming
            ? "bg-white/20 border-white/30 text-gray-800 dark:text-gray-200 rounded-tl-md hover:bg-white/25"
            : "bg-gradient-to-br from-blue-500/80 to-blue-600/90 border-blue-400/30 text-white rounded-tr-md hover:from-blue-500/90 hover:to-blue-600/95"
        )}
      >
        {/* Main content container */}
        <div className="px-4 py-3">
          {/* Media content */}
          {hasMedia && (
            <div className="mb-3 -mx-1">
              <MessageMedia
                mediaType={message.mediaType}
                mediaUrl={message.mediaUrl}
                mediaCache={message.media_cache}
                fileName={message.media_cache?.file_name}
                isIncoming={isIncoming}
              />
            </div>
          )}

          {/* Text content */}
          {message.text && (
            <div className={cn(
              "text-sm leading-relaxed break-words",
              hasMedia && "mt-2"
            )}>
              {message.text}
            </div>
          )}

          {/* Timestamp and status row */}
          <div className={cn(
            "flex items-center justify-end gap-2 mt-2 text-xs",
            isIncoming 
              ? "text-gray-600 dark:text-gray-400" 
              : "text-white/80"
          )}>
            <span className="font-medium">
              {message.time}
            </span>
            {renderStatusIcon()}
          </div>
        </div>

        {/* Subtle shine effect for sent messages */}
        {!isIncoming && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.text === nextProps.message.text &&
    prevProps.message.status === nextProps.message.status &&
    prevProps.message.mediaUrl === nextProps.message.mediaUrl &&
    prevProps.isNewMessage === nextProps.isNewMessage
  );
});

MessageItem.displayName = 'MessageItem';
