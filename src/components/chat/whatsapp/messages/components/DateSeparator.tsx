
import React from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DateSeparatorProps {
  date: Date;
}

export const DateSeparator: React.FC<DateSeparatorProps> = ({ date }) => {
  const formatDate = (date: Date): string => {
    if (isToday(date)) {
      return 'Hoje';
    } else if (isYesterday(date)) {
      return 'Ontem';
    } else {
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    }
  };

  return (
    <div className="flex items-center justify-center py-4 px-4">
      <div className="bg-white/20 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 shadow-sm">
        <span className="text-xs font-medium text-gray-600/80">
          {formatDate(date)}
        </span>
      </div>
    </div>
  );
};
