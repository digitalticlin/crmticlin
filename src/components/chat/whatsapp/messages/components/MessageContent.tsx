
import React from 'react';
import { cn } from '@/lib/utils';

interface MessageContentProps {
  content: string;
  isIncoming: boolean;
}

export const MessageContent: React.FC<MessageContentProps> = ({
  content,
  isIncoming
}) => {
  if (!content) return null;

  return (
    <div className={cn(
      "text-sm leading-relaxed break-words",
      isIncoming ? "text-gray-900 dark:text-white" : "text-white"
    )}>
      {content}
    </div>
  );
};
