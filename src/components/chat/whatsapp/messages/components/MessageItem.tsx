
import React, { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Message } from '@/types/chat';
import { MessageMedia } from '../MessageMedia';

interface MessageItemProps {
  message: Message;
  isNewMessage: boolean;
}

export const MessageItem = memo(({ 
  message, 
  isNewMessage 
}: MessageItemProps) => {
  const isFromMe = message.fromMe || message.sender === "user";
  
  // Renderização de conteúdo otimizada
  const messageContent = useMemo(() => {
    const isRealMedia = message.mediaType && 
      message.mediaType !== 'text' && 
      ['image', 'video', 'audio', 'document'].includes(message.mediaType) &&
      message.mediaUrl;

    if (!isRealMedia) {
      return (
        <div className="space-y-1">
          {message.text && (
            <p className={cn(
              "text-sm leading-relaxed whitespace-pre-wrap break-words",
              isFromMe ? "text-white" : "text-gray-800"
            )}>
              {message.text}
            </p>
          )}
        </div>
      );
    }

    // Render mídia com componentes otimizados
    return (
      <div className="space-y-2">
        <MessageMedia
          messageId={message.id}
          mediaType={message.mediaType as any}
          mediaUrl={message.mediaUrl}
          fileName={message.text || undefined}
        />
        {message.text && message.text !== '[Mensagem de mídia]' && message.text !== '[Áudio]' && (
          <p className={cn(
            "text-sm leading-relaxed whitespace-pre-wrap break-words",
            isFromMe ? "text-white" : "text-gray-800"
          )}>
            {message.text}
          </p>
        )}
      </div>
    );
  }, [message.id, message.mediaType, message.mediaUrl, message.text, isFromMe]);

  return (
    <div className={cn(
      "flex mb-3 px-4 py-2 transition-all duration-200",
      isFromMe ? "justify-end" : "justify-start",
      isNewMessage && "animate-in slide-in-from-bottom-2 duration-300"
    )}>
      <div className={cn(
        "max-w-[80%] md:max-w-[70%] rounded-2xl p-3 shadow-sm",
        isFromMe 
          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md" 
          : "bg-white text-gray-800 rounded-bl-md border border-gray-100"
      )}>
        {messageContent}
        <div className={cn(
          "text-xs mt-1 flex items-center justify-end space-x-1",
          isFromMe ? "text-blue-100" : "text-gray-500"
        )}>
          <span>{message.time}</span>
          {isFromMe && message.status && (
            <span className={cn(
              "material-icons text-xs",
              message.status === 'read' ? 'text-blue-200' : 'text-blue-300'
            )}>
              {message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓' : '⏱'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';
