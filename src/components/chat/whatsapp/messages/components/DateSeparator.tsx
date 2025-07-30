
import React from 'react';

interface DateSeparatorProps {
  date: Date;
}

export const DateSeparator: React.FC<DateSeparatorProps> = React.memo(({ date }) => (
  <div className="flex justify-center my-4">
    <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full shadow-sm">
      {date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      })}
    </div>
  </div>
));

DateSeparator.displayName = 'DateSeparator';
