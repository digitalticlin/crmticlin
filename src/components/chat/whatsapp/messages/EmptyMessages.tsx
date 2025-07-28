
import React from 'react';
import { MessageSquare } from 'lucide-react';

export const EmptyMessages = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-gray-500">
      <MessageSquare className="h-16 w-16 mb-4 text-gray-300" />
      <h3 className="text-lg font-medium mb-2">Selecione um contato</h3>
      <p className="text-sm text-center max-w-sm">
        Escolha um contato da lista para começar a conversa ou ver o histórico de mensagens.
      </p>
    </div>
  );
};
