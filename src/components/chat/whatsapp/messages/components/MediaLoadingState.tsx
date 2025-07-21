
import React from 'react';
import { Loader2, Download } from 'lucide-react';

export const MediaLoadingState: React.FC = () => {
  return (
    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
      <div className="flex-1">
        <span className="text-sm text-gray-700 font-medium">Carregando mídia...</span>
        <p className="text-xs text-gray-500 mt-1">Processando dados do cache e storage</p>
      </div>
    </div>
  );
};
