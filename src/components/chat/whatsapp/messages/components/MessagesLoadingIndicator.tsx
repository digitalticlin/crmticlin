
import React from 'react';

export const MessagesLoadingIndicator: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="flex items-center space-x-2 text-muted-foreground">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span>Carregando mensagens...</span>
      </div>
    </div>
  );
};
