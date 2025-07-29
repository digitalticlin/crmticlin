
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { MessageMediaRenderer } from './MessageMediaRenderer';
import { MessageStatus } from './MessageStatus';
import { MessageActions } from './MessageActions';
import { CheckCircle, Info, AlertCircle } from 'lucide-react';

interface MessageItemProps {
  message: any;
  isLast: boolean;
  onResend?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  className?: string;
}

export function MessageItem({ 
  message, 
  isLast, 
  onResend, 
  onDelete,
  className = ""
}: MessageItemProps) {
  const timeAgo = formatDistanceToNow(new Date(message.timestamp), {
    addSuffix: true,
    locale: ptBR
  });

  const isFromMe = message.from_me;
  const hasError = message.status === 'error' || message.status === 'failed';
  const isPending = message.status === 'pending';

  return (
    <div className={cn(
      "message-item w-full px-4 py-2 transition-all duration-300",
      "animate-in fade-in-0 slide-in-from-bottom-2",
      isLast && "pb-6",
      className
    )}>
      <div className={cn(
        "flex w-full",
        isFromMe ? "justify-end" : "justify-start"
      )}>
        <div className={cn(
          "group relative max-w-[70%] rounded-2xl p-4 shadow-lg transition-all duration-300",
          "border backdrop-blur-lg",
          "hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]",
          
          // Glassmorphism para mensagens próprias
          isFromMe && [
            "bg-white/20 border-white/10",
            "bg-gradient-to-br from-ticlin-500/20 to-ticlin-600/30",
            "border-ticlin-400/20 text-white",
            "shadow-ticlin-500/10"
          ],
          
          // Glassmorphism para mensagens recebidas
          !isFromMe && [
            "bg-white/20 border-white/10 text-gray-800",
            "shadow-black/5"
          ],
          
          // Estados de erro
          hasError && [
            "border-red-400/30 bg-red-50/30",
            isFromMe ? "bg-gradient-to-br from-red-500/20 to-red-600/30" : "bg-red-50/30"
          ],
          
          // Estados pendentes
          isPending && [
            "border-yellow-400/30",
            isFromMe ? "bg-gradient-to-br from-yellow-500/20 to-yellow-600/30" : "bg-yellow-50/30"
          ]
        )}>
        
          {/* Efeito de brilho sutil */}
          <div className={cn(
            "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300",
            "bg-gradient-to-br from-white/5 to-white/0",
            "group-hover:opacity-100 pointer-events-none"
          )} />
          
          {/* Status visual superior */}
          {(hasError || isPending) && (
            <div className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 rounded-full bg-white/90 backdrop-blur-sm border border-white/20 shadow-lg">
              {hasError && <AlertCircle className="w-3 h-3 text-red-500" />}
              {isPending && <Info className="w-3 h-3 text-yellow-500 animate-pulse" />}
            </div>
          )}

          {/* Conteúdo da mensagem */}
          <div className="relative z-10 space-y-3">
            {/* Mídia */}
            {message.media_type !== 'text' && (
              <MessageMediaRenderer 
                message={message}
                className="rounded-xl overflow-hidden shadow-md"
              />
            )}
            
            {/* Texto da mensagem */}
            {message.text && (
              <div className={cn(
                "text-sm leading-relaxed break-words",
                isFromMe ? "text-white/90" : "text-gray-800/90"
              )}>
                {message.text}
              </div>
            )}
            
            {/* Rodapé da mensagem */}
            <div className="flex items-center justify-between gap-2 mt-3">
              <div className={cn(
                "flex items-center gap-2 text-xs",
                isFromMe ? "text-white/70" : "text-gray-600/70"
              )}>
                <span className="font-medium">
                  {timeAgo}
                </span>
                
                {message.import_source && (
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs",
                    "bg-white/10 border border-white/20 backdrop-blur-sm"
                  )}>
                    {message.import_source}
                  </span>
                )}
              </div>
              
              {/* Status da mensagem */}
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
