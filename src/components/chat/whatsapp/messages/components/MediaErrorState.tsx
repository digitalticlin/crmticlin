
import React from 'react';

interface MediaErrorStateProps {
  error?: string;
}

export const MediaErrorState: React.FC<MediaErrorStateProps> = ({ error }) => {
  return (
    <div className="p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
      <span className="text-sm text-gray-500">
        📎 {error || 'Mídia indisponível'}
      </span>
    </div>
  );
};
