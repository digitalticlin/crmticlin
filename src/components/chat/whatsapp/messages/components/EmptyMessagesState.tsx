
import React from 'react';

export const EmptyMessagesState: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="text-center text-muted-foreground">
        <div className="mb-2">💬</div>
        <p>Nenhuma mensagem ainda</p>
        <p className="text-sm">Inicie uma conversa!</p>
      </div>
    </div>
  );
};
