
import React from 'react';
import { Message } from '@/types/chat';
import { WhatsAppMessagesList } from './WhatsAppMessagesList';

interface ChatMessagesProps {
  messages: Message[];
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMoreMessages?: boolean;
  onLoadMore?: () => Promise<void>;
}

export const ChatMessages = ({ 
  messages, 
  isLoading = false,
  isLoadingMore = false,
  hasMoreMessages = false,
  onLoadMore
}: ChatMessagesProps) => {
  return (
    <WhatsAppMessagesList 
      messages={messages}
      isLoading={isLoading}
      isLoadingMore={isLoadingMore}
      hasMoreMessages={hasMoreMessages}
      onLoadMore={onLoadMore}
    />
  );
};
