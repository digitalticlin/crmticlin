
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MessageTimestampProps {
  timestamp: string;
}

export const MessageTimestamp: React.FC<MessageTimestampProps> = ({
  timestamp
}) => {
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return format(date, 'HH:mm', { locale: ptBR });
    } catch {
      return '';
    }
  };

  return (
    <span className="text-xs opacity-70">
      {formatTimestamp(timestamp)}
    </span>
  );
};
