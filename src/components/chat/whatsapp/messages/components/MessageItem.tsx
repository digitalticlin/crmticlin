
import React, { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Message } from '@/types/chat';
import { MessageMedia } from '../MessageMedia';

interface MessageItemProps {
  message: Message;
  isNewMessage?: boolean;
}

export const MessageItem = memo(({ 
  message, 
  isNewMessage = false 
}: MessageItemProps) => {
  const isFromMe = message.fromMe || message.sender === "user";
  
  // Determinar se é mídia real
  const isRealMedia = useMemo(() => {
    return message.mediaType && 
           message.mediaType !== 'text' && 
           ['image', 'video', 'audio', 'document'].includes(message.mediaType) &&
           message.mediaUrl;
  }, [message.mediaType, message.mediaUrl]);

  // Renderização do conteúdo
  const messageContent = useMemo(() => {
    if (isRealMedia) {
      return (
        <div className="space-y-2">
          <MessageMedia
            messageId={message.id}
            mediaType={message.mediaType as 'image' | 'video' | 'audio' | 'document'}
            mediaUrl={message.mediaUrl}
            fileName={message.text || undefined}
          />
          {message.text && 
           !['[Mensagem de mídia]', '[Áudio]', '[Imagem]', '[Vídeo]', '[Documento]'].includes(message.text) && (
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

    // Texto simples
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
  }, [message.id, message.mediaType, message.mediaUrl, message.text, isFromMe, isRealMedia]);

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
        
        {/* Timestamp e status */}
        <div className={cn(
          "text-xs mt-1 flex items-center justify-end space-x-1",
          isFromMe ? "text-blue-100" : "text-gray-500"
        )}>
          <span>{message.time}</span>
          {isFromMe && message.status && (
            <span className="text-xs">
              {message.status === 'read' && '✓✓'}
              {message.status === 'delivered' && '✓'}
              {message.status === 'sent' && '⏱'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';
