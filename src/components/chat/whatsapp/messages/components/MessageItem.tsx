
import React, { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Message } from '@/types/chat';
import { MessageMedia } from '../MessageMedia';
import { Check, CheckCheck, Clock } from "lucide-react";

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
           (message.mediaUrl || message.media_cache);
  }, [message.mediaType, message.mediaUrl, !!message.media_cache]);

  // Renderizar ícone de status como no WhatsApp
  const renderStatusIcon = useMemo(() => {
    if (!isFromMe || !message.status) return null;

    switch (message.status) {
      case 'sent':
        // Um check cinza - mensagem enviada
        return <Check className="h-3 w-3 text-white/60" />;
      case 'delivered':
        // Dois checks cinzas - mensagem entregue
        return <CheckCheck className="h-3 w-3 text-white/60" />;
      case 'read':
        // Dois checks azuis - mensagem lida
        return <CheckCheck className="h-3 w-3 text-blue-300" />;
      default:
        // Relógio para mensagens pendentes
        return <Clock className="h-3 w-3 text-white/40" />;
    }
  }, [isFromMe, message.status]);

  // Renderização do conteúdo
  const messageContent = useMemo(() => {
    if (isRealMedia) {
      return (
        <div className="space-y-2">
          <MessageMedia
            messageId={message.id}
            mediaType={message.mediaType as 'image' | 'video' | 'audio' | 'document'}
            mediaUrl={message.mediaUrl}
            fileName={message.mediaType === 'document' ? (message.text || undefined) : undefined}  // ✅ Só documento tem fileName
            mediaCache={message.media_cache}
          />
          {message.text && 
           message.mediaType === 'document' &&  // ✅ Só mostrar texto para documentos
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
  }, [message.id, message.mediaType, message.mediaUrl, message.text, isFromMe, isRealMedia, message.media_cache?.id]);

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
        
        {/* Timestamp e status - Estilo WhatsApp */}
        <div className={cn(
          "text-xs mt-2 flex items-center justify-end gap-1",
          isFromMe ? "text-blue-100" : "text-gray-500"
        )}>
          <span>{message.time}</span>
          {renderStatusIcon}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // ✅ COMPARAÇÃO OTIMIZADA: Só re-renderizar se realmente algo visual mudou
  const prev = prevProps.message;
  const next = nextProps.message;
  
  // Se é a mesma mensagem por ID e o status é o mesmo, não re-renderizar
  const sameId = prev.id === next.id;
  const sameStatus = prev.status === next.status;
  const sameText = prev.text === next.text;
  const sameMediaUrl = prev.mediaUrl === next.mediaUrl;
  const sameMediaType = prev.mediaType === next.mediaType;
  const sameCacheId = prev.media_cache?.id === next.media_cache?.id;
  const sameNewMessage = prevProps.isNewMessage === nextProps.isNewMessage;
  
  // ✅ DEBUG: Verificar TODAS as propriedades que podem estar mudando
  const sameTimestamp = prev.timestamp === next.timestamp;
  const sameTime = prev.time === next.time;
  const sameSender = prev.sender === next.sender;
  const sameFromMe = prev.fromMe === next.fromMe;
  const sameIsIncoming = prev.isIncoming === next.isIncoming;
  const sameIsOptimistic = prev.isOptimistic === next.isOptimistic;
  
  const shouldSkipRender = sameId && sameStatus && sameText && sameMediaUrl && sameMediaType && sameCacheId && sameNewMessage && sameTimestamp && sameTime && sameSender && sameFromMe && sameIsIncoming && sameIsOptimistic;
  
  if (shouldSkipRender) {
    console.log('[MessageItem] ⚡ OTIMIZAÇÃO: Evitando re-render desnecessário para:', prev.id.substring(0, 8));
    return true; // ✅ PULAR re-render
  } else {
    console.log('[MessageItem] 🔄 Re-renderizando devido a mudanças:', {
      id: prev.id.substring(0, 8),
      statusChanged: !sameStatus,
      textChanged: !sameText,
      mediaChanged: !sameMediaUrl || !sameMediaType,
      cacheChanged: !sameCacheId,
      timestampChanged: !sameTimestamp,
      timeChanged: !sameTime,
      senderChanged: !sameSender,
      fromMeChanged: !sameFromMe,
      isIncomingChanged: !sameIsIncoming,
      isOptimisticChanged: !sameIsOptimistic,
      newMessageChanged: !sameNewMessage
    });
    return false; // ✅ PERMITIR re-render
  }
});

MessageItem.displayName = 'MessageItem';
