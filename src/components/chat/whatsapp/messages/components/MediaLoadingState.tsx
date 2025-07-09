
import React from 'react';

export const MediaLoadingState: React.FC = () => {
  return (
    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
      <span className="text-sm text-gray-600">Carregando mídia...</span>
    </div>
  );
};
