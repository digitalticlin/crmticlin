
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { MessageMediaEnhanced } from '../MessageMediaEnhanced';
import { MessageMediaDirect } from '../MessageMediaDirect';
import { MessageStatus } from './MessageStatus';
import { MessageActions } from './MessageActions';
import { CheckCircle, Info, AlertCircle, Bot } from 'lucide-react';

interface MessageItemProps {
  message: any;
  isLastMessage: boolean;
  onResend?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  className?: string;
}

export function MessageItem({
  message,
  isLastMessage,
  onResend,
  onDelete,
  className = ""
}: MessageItemProps) {
  // 🚀 CORREÇÃO: Formato HH:MM para o horário
  const messageTime = format(new Date(message.timestamp), 'HH:mm', { locale: ptBR });

  const isFromMe = message.fromMe;
  const hasError = message.status === 'error' || message.status === 'failed';
  const isPending = message.status === 'pending' || message.status === 'sending';

  // 🤖 Detectar se é uma mensagem da IA (apenas mensagens enviadas com source_edge)
  const isAIMessage = isFromMe && message.source_edge === 'ai_messaging_service';


  return (
    <div className={cn(
      "message-item w-full px-4 py-1 transition-all duration-300",
      "animate-in fade-in-0 slide-in-from-bottom-2",
      isLastMessage && "pb-4",
      className
    )}>
      <div className={cn(
        "flex w-full items-start gap-2",
        isFromMe ? "justify-end" : "justify-start"
      )}>
        {/* Espaçador para empurrar o ícone e mensagem para a direita */}
        {isFromMe && <div className="flex-1" />}

        {/* 🤖 ÍCONE DE IA - Lado esquerdo da mensagem enviada */}
        {isFromMe && isAIMessage && (
          <div className="flex items-center justify-center w-6 h-6 bg-green-500 rounded-full flex-shrink-0 mr-2"
               title="Mensagem enviada pela IA">
            <Bot className="w-3 h-3 text-white" />
          </div>
        )}

        {/* 🚀 CORREÇÃO: Balão de conversa estilo WhatsApp */}
        <div className={cn(
          "group relative max-w-[70%] rounded-2xl p-3 shadow-md transition-all duration-300",
          "hover:shadow-lg",
          
          // 🚀 CORREÇÃO: Formato de balão assimétrico
          isFromMe ? [
            "rounded-br-sm", // Canto inferior direito menos arredondado
            "bg-ticlin-500 text-white", // 🚀 CORREÇÃO: Balão escuro para mensagens enviadas
            "shadow-ticlin-500/20"
          ] : [
            "rounded-bl-sm", // Canto inferior esquerdo menos arredondado
            "bg-white/90 text-gray-800 border border-gray-200/50",
            "shadow-gray-500/10"
          ],
          
          // Estados de erro
          hasError && [
            "border-red-400/50",
            isFromMe ? "bg-red-600 text-white" : "bg-red-50 text-red-800"
          ],
          
          // Estados pendentes
          isPending && [
            "border-yellow-400/50",
            isFromMe ? "bg-ticlin-600/80 text-white" : "bg-yellow-50 text-yellow-800"
          ]
        )}>

          {/* Status visual superior */}
          {hasError && (
            <div className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 rounded-full bg-white shadow-md border border-gray-200">
              <AlertCircle className="w-3 h-3 text-red-500" />
            </div>
          )}

          {/* Conteúdo da mensagem */}
          <div className="space-y-2">
            {/* Mídia */}
            {message.mediaType !== 'text' && (
              <>
                {/* 🚀 RENDERIZAÇÃO DIRETA quando media_url está presente */}
                {message.mediaUrl ? (
                  <MessageMediaDirect
                    messageId={message.id}
                    mediaType={message.mediaType}
                    mediaUrl={message.mediaUrl}
                    fileName={message.fileName}
                    isIncoming={!isFromMe}
                    className="rounded-lg overflow-hidden"
                  />
                ) : (
                  /* 🔄 FALLBACK para hook complexo quando media_url não está presente */
                  <MessageMediaEnhanced 
                    messageId={message.id}
                    mediaType={message.mediaType}
                    mediaUrl={message.mediaUrl}
                    fileName={message.fileName}
                    isIncoming={!isFromMe}
                    mediaCache={message.media_cache}
                    className="rounded-lg overflow-hidden"
                  />
                )}
              </>
            )}
            
            {/* Texto da mensagem */}
            {message.text && (
              <div className="text-sm leading-relaxed break-words">
                {message.text}
              </div>
            )}
            
            {/* Rodapé da mensagem */}
            <div className="flex items-center justify-between gap-2 mt-2">
              <div className="flex items-center gap-1">
                {/* 🚀 CORREÇÃO: Horário em formato HH:MM */}
                <span className={cn(
                  "text-xs font-medium",
                  isFromMe ? "text-white/70" : "text-gray-600/70"
                )}>
                  {messageTime}
                </span>


                {message.import_source && (
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs",
                    "bg-black/10 text-current"
                  )}>
                    {message.import_source}
                  </span>
                )}
              </div>

              {/* Status da mensagem - apenas ícone */}
              {isFromMe && (
                <MessageStatus
                  status={message.status}
                  className="flex-shrink-0"
                />
              )}
            </div>
          </div>

          {/* Ações da mensagem */}
          <MessageActions
            message={message}
            onResend={onResend}
            onDelete={onDelete}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          />
        </div>
      </div>
    </div>
  );
}
