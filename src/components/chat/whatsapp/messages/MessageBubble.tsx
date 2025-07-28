
import React from 'react';
import { Message } from '@/types/chat';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isOutgoing = message.sender === 'user';
  
  return (
    <div className={cn(
      "flex mb-4",
      isOutgoing ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
        isOutgoing 
          ? "bg-green-500 text-white" 
          : "bg-white text-gray-800 border"
      )}>
        <p className="text-sm">{message.text}</p>
        <p className={cn(
          "text-xs mt-1",
          isOutgoing ? "text-green-100" : "text-gray-500"
        )}>
          {formatDistanceToNow(new Date(message.timestamp || message.time), { 
            addSuffix: true, 
            locale: ptBR 
          })}
        </p>
      </div>
    </div>
  );
};
