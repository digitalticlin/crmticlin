
/**
 * 🎯 COMPONENTE DE MENSAGEM COM ANIMAÇÕES
 * 
 * CORREÇÕES IMPLEMENTADAS:
 * ✅ Animações suaves para aparição
 * ✅ Bounce effect para mensagens novas
 * ✅ Transições otimizadas
 * ✅ Suporte a mídia melhorado
 */

import React, { useEffect, useRef } from 'react';
import { Message } from '@/types/chat';
import { cn } from '@/lib/utils';
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';

interface MessageItemProps {
  message: Message & { shouldAnimate?: boolean };
  isLastMessage?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({ 
  message, 
  isLastMessage = false 
}) => {
  const messageRef = useRef<HTMLDivElement>(null);
  const isNewMessage = (message as any).isNew;

  // 🚀 CORREÇÃO: Trigger animação para mensagens novas
  useEffect(() => {
    if (isNewMessage && messageRef.current) {
      // Remover flag após animação
      setTimeout(() => {
        if (messageRef.current) {
          messageRef.current.classList.remove('animate-fade-in');
        }
      }, 500);
    }
  }, [isNewMessage]);

  // 🚀 CORREÇÃO: Bounce effect para mensagens externas
  useEffect(() => {
    if (message.shouldAnimate && !message.fromMe && messageRef.current) {
      messageRef.current.classList.add('animate-bounce');
      setTimeout(() => {
        if (messageRef.current) {
          messageRef.current.classList.remove('animate-bounce');
        }
      }, 1000);
    }
  }, [message.shouldAnimate, message.fromMe]);

  // Status icon baseado no status da mensagem
  const getStatusIcon = () => {
    if (!message.fromMe) return null;
    
    switch (message.status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-gray-400 animate-spin" />;
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return <Check className="w-3 h-3 text-gray-400" />;
    }
  };

  // 🚀 CORREÇÃO: Renderizar mídia se disponível
  const renderMedia = () => {
    if (!message.mediaUrl || message.mediaType === 'text') return null;

    const mediaClasses = "max-w-xs rounded-lg shadow-md";

    switch (message.mediaType) {
      case 'image':
        return (
          <img 
            src={message.mediaUrl} 
            alt="Imagem" 
            className={cn(mediaClasses, "hover:scale-105 transition-transform cursor-pointer")}
            onClick={() => window.open(message.mediaUrl, '_blank')}
          />
        );
      case 'video':
        return (
          <video 
            src={message.mediaUrl} 
            controls 
            className={mediaClasses}
            preload="metadata"
          />
        );
      case 'audio':
        return (
          <audio 
            src={message.mediaUrl} 
            controls 
            className="w-full max-w-xs"
          />
        );
      default:
        return (
          <a 
            href={message.mediaUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 underline"
          >
            📎 Arquivo anexado
          </a>
        );
    }
  };

  return (
    <div
      ref={messageRef}
      data-message-id={message.id}
      className={cn(
        "flex mb-2 transition-all duration-300",
        message.fromMe ? "justify-end" : "justify-start",
        isNewMessage && "animate-fade-in",
        message.shouldAnimate && !message.fromMe && "animate-bounce"
      )}
    >
      <div
        className={cn(
          "max-w-xs lg:max-w-md px-3 py-2 rounded-lg shadow-sm transition-all duration-200",
          message.fromMe
            ? "bg-blue-500 text-white ml-auto hover:bg-blue-600"
            : "bg-gray-100 text-gray-800 mr-auto hover:bg-gray-200",
          message.status === 'sending' && "opacity-70",
          message.status === 'failed' && "bg-red-100 border border-red-300"
        )}
      >
        {/* Renderizar mídia */}
        {renderMedia()}
        
        {/* Texto da mensagem */}
        {message.text && (
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.text}
          </p>
        )}
        
        {/* Footer com hora e status */}
        <div className={cn(
          "flex items-center justify-end mt-1 gap-1",
          message.fromMe ? "text-blue-100" : "text-gray-500"
        )}>
          <span className="text-xs">{message.time}</span>
          {getStatusIcon()}
        </div>
      </div>
    </div>
  );
};
