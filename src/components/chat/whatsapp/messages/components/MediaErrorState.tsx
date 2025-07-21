
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface MediaErrorStateProps {
  error?: string;
}

export const MediaErrorState: React.FC<MediaErrorStateProps> = ({ error }) => {
  return (
    <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
      <div className="flex items-center space-x-2 text-center">
        <AlertCircle className="w-5 h-5 text-gray-400" />
        <span className="text-sm text-gray-500">
          {error || 'Mídia indisponível'}
        </span>
      </div>
    </div>
  );
};
