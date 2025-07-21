
import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface MediaErrorStateProps {
  error?: string;
  onRetry?: () => void;
}

export const MediaErrorState: React.FC<MediaErrorStateProps> = ({ error, onRetry }) => {
  return (
    <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
      <div className="flex items-center space-x-2 text-center">
        <AlertCircle className="w-5 h-5 text-gray-400" />
        <div className="flex-1">
          <span className="text-sm text-gray-600 font-medium">
            {error || 'Mídia indisponível'}
          </span>
          <p className="text-xs text-gray-500 mt-1">
            A mídia pode ter expirado ou não estar disponível no momento
          </p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-blue-500 hover:text-blue-700 p-1 rounded transition-colors"
            title="Tentar novamente"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
