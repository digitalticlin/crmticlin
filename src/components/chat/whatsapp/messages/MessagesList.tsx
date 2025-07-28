
import React from 'react';
import { Message } from '@/types/chat';
import { MessageBubble } from './MessageBubble';
import { Loader2 } from 'lucide-react';

interface MessagesListProps {
  messages: Message[];
  isLoading: boolean;
  loadMoreMessages: () => void;
  hasMoreMessages: boolean;
  isLoadingMore: boolean;
}

export const MessagesList = ({ 
  messages, 
  isLoading, 
  loadMoreMessages, 
  hasMoreMessages,
  isLoadingMore 
}: MessagesListProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Load More Button */}
      {hasMoreMessages && (
        <div className="text-center">
          <button
            onClick={loadMoreMessages}
            disabled={isLoadingMore}
            className="px-4 py-2 text-sm bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 disabled:opacity-50"
          >
            {isLoadingMore ? 'Carregando...' : 'Carregar mensagens anteriores'}
          </button>
        </div>
      )}

      {/* Messages */}
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
};
