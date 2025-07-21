
import React from 'react';
import { Loader2 } from 'lucide-react';

export const MediaLoadingState: React.FC = () => {
  return (
    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      <span className="text-sm text-gray-600">Carregando mídia...</span>
    </div>
  );
};
