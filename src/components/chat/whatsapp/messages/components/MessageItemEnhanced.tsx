
import React from 'react';
import { cn } from '@/lib/utils';
import { Message } from '@/types/chat';
import { MessageMediaEnhanced } from '../MessageMediaEnhanced';

interface MessageItemEnhancedProps {
  message: Message;
  isLastMessage?: boolean;
}

export const MessageItemEnhanced: React.FC<MessageItemEnhancedProps> = React.memo(({ 
  message, 
  isLastMessage = false 
}) => {
  const isIncoming = message.sender === 'contact' || !message.fromMe;
  
  return (
    <div
      className={cn(
        "flex w-full mb-2 animate-fadeIn",
        isIncoming ? "justify-start" : "justify-end"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] md:max-w-[70%] rounded-lg px-3 py-2 break-words shadow-sm",
          isIncoming
            ? "bg-white text-gray-900 rounded-bl-none"
            : "bg-green-600 text-white rounded-br-none"
        )}
      >
        {/* ✅ RENDERIZAR MÍDIA SE HOUVER */}
        {message.mediaType && message.mediaType !== 'text' && (
          <div className="mb-2">
            <MessageMediaEnhanced
              messageId={message.id}
              mediaType={message.mediaType as any}
              mediaUrl={message.mediaUrl}
              fileName={message.fileName}
              isIncoming={isIncoming}
              mediaCache={message.media_cache}
              className="max-w-full"
            />
          </div>
        )}
        
        {/* ✅ TEXTO DA MENSAGEM */}
        {message.text && (
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.text}
          </div>
        )}
        
        {/* ✅ TIMESTAMP E STATUS */}
        <div
          className={cn(
            "flex items-center justify-end gap-1 mt-2 text-xs opacity-70",
            isIncoming ? "text-gray-500" : "text-green-100"
          )}
        >
          <span>{message.time}</span>
          {!isIncoming && (
            <div className="flex">
              {message.status === 'sent' && "✓"}
              {message.status === 'delivered' && "✓✓"}
              {message.status === 'read' && <span className="text-blue-300">✓✓</span>}
              {message.status === 'failed' && <span className="text-red-300">✗</span>}
            </div>
          )}
        </div>
        
        {/* ✅ DEBUG INFO (apenas em desenvolvimento) */}
        {process.env.NODE_ENV === 'development' && message.mediaType !== 'text' && (
          <div className="mt-2 text-xs opacity-50 border-t pt-1">
            <div>Cache: {message.hasMediaCache ? '✅' : '❌'}</div>
            <div>ID: {message.mediaCacheId || 'N/A'}</div>
            <div>File: {message.fileName || 'N/A'}</div>
          </div>
        )}
      </div>
    </div>
  );
});

MessageItemEnhanced.displayName = 'MessageItemEnhanced';
