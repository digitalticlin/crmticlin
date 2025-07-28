
import React, { memo } from 'react';
import { Message } from '@/types/chat';
import { cn } from '@/lib/utils';
import { Check, CheckCheck, Clock, AlertCircle, RefreshCw } from 'lucide-react';

interface MessageItemProps {
  message: Message;
  isNewMessage?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = memo(({ message, isNewMessage }) => {
  const isOptimistic = (message as any).isOptimistic;
  const isFailed = message.status === 'failed';
  const isSending = message.status === 'sending';

  return (
    <div
      className={cn(
        "flex w-full",
        message.fromMe ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-lg p-3 shadow-sm",
          message.fromMe 
            ? "bg-green-500 text-white rounded-tr-none" 
            : "bg-white dark:bg-gray-800 rounded-tl-none",
          isOptimistic && "opacity-80",
          isFailed && "bg-red-100 border border-red-300",
          isSending && "bg-blue-100 border border-blue-300",
          isNewMessage && !isOptimistic && "animate-in slide-in-from-bottom-2"
        )}
      >
        <div className="whitespace-pre-wrap break-words">
          {message.text}
        </div>
        
        <div className={cn(
          "flex items-center justify-end gap-1 text-xs mt-1",
          message.fromMe ? "text-white/70" : "text-gray-500"
        )}>
          <span>{message.time}</span>
          
          {message.fromMe && (
            <div className="flex items-center">
              {isSending && (
                <RefreshCw className="h-3 w-3 animate-spin ml-1" />
              )}
              {isFailed && (
                <AlertCircle className="h-3 w-3 text-red-500 ml-1" />
              )}
              {!isSending && !isFailed && (
                <>
                  {message.status === 'sent' && <Check className="h-3 w-3 ml-1" />}
                  {message.status === 'delivered' && <CheckCheck className="h-3 w-3 ml-1" />}
                  {message.status === 'read' && <CheckCheck className="h-3 w-3 text-blue-400 ml-1" />}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';
