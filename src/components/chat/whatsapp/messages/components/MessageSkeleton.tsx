
import React from 'react';
import { cn } from '@/lib/utils';

interface MessageSkeletonProps {
  isFromMe?: boolean;
  showAvatar?: boolean;
}

export const MessageSkeleton: React.FC<MessageSkeletonProps> = ({
  isFromMe = false,
  showAvatar = true
}) => {
  return (
    <div className={cn(
      "flex w-full mb-4 animate-pulse",
      isFromMe ? "justify-end" : "justify-start"
    )}>
      {/* Avatar skeleton - apenas para mensagens recebidas */}
      {!isFromMe && showAvatar && (
        <div className="w-8 h-8 bg-gray-300 rounded-full mr-2 flex-shrink-0" />
      )}
      
      {/* Message bubble skeleton */}
      <div className={cn(
        "max-w-[70%] rounded-lg p-3 space-y-2",
        isFromMe 
          ? "bg-blue-100 rounded-tr-none" 
          : "bg-gray-200 rounded-tl-none"
      )}>
        {/* Text lines */}
        <div className={cn(
          "h-4 bg-gray-300 rounded",
          isFromMe ? "bg-blue-200" : "bg-gray-300"
        )} style={{ width: `${Math.random() * 40 + 60}%` }} />
        
        {/* Sometimes add a second line */}
        {Math.random() > 0.5 && (
          <div className={cn(
            "h-4 bg-gray-300 rounded",
            isFromMe ? "bg-blue-200" : "bg-gray-300"
          )} style={{ width: `${Math.random() * 30 + 40}%` }} />
        )}
        
        {/* Timestamp */}
        <div className={cn(
          "h-3 bg-gray-300 rounded ml-auto",
          isFromMe ? "bg-blue-200" : "bg-gray-300"
        )} style={{ width: '40px' }} />
      </div>
    </div>
  );
};

// ✅ COMPONENTE DE MÚLTIPLOS SKELETONS
export const MessagesSkeletonList: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="space-y-2 px-4">
      {Array.from({ length: count }).map((_, index) => (
        <MessageSkeleton
          key={index}
          isFromMe={Math.random() > 0.5}
          showAvatar={index === 0 || Math.random() > 0.7}
        />
      ))}
    </div>
  );
};
