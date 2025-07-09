
import React from 'react';

export const LoadMoreIndicator: React.FC = () => {
  return (
    <div className="flex justify-center py-4">
      <div className="flex items-center space-x-2 text-xs text-gray-500">
        <div className="animate-spin rounded-full h-4 w-4 border-b border-gray-400"></div>
        <span>Carregando mensagens anteriores...</span>
      </div>
    </div>
  );
};
