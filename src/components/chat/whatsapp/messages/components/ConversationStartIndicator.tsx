
import React from 'react';

interface ConversationStartIndicatorProps {
  hasMoreMessages: boolean;
  messagesCount: number;
}

export const ConversationStartIndicator: React.FC<ConversationStartIndicatorProps> = ({
  hasMoreMessages,
  messagesCount
}) => {
  if (!hasMoreMessages && messagesCount > 20) {
    return (
      <div className="flex justify-center py-2">
        <span className="text-xs text-gray-400">• • • Início da conversa • • •</span>
      </div>
    );
  }
  return null;
};
