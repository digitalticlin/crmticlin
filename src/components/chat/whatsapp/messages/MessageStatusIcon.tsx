import React from 'react';

interface MessageStatusIconProps {
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  fromMe?: boolean;
}

export const MessageStatusIcon: React.FC<MessageStatusIconProps> = ({ status, fromMe }) => {
  // Só mostrar status para mensagens enviadas pelo usuário
  if (!fromMe) return null;

  switch (status) {
    case 'sending':
      return (
        <div className="flex items-center text-xs text-gray-500 ml-2">
          <div className="w-3 h-3 border border-gray-400 rounded-full animate-spin border-t-transparent" />
        </div>
      );
    
    case 'sent':
      return (
        <div className="flex items-center text-xs text-gray-500 ml-2">
          <span>✓✓</span>
        </div>
      );
    
    case 'delivered':
      return (
        <div className="flex items-center text-xs text-gray-500 ml-2">
          <span>✓✓</span>
        </div>
      );
    
    case 'read':
      return (
        <div className="flex items-center text-xs text-blue-500 ml-2">
          <span>✓✓</span>
        </div>
      );
    
    case 'failed':
      return (
        <div className="flex items-center text-xs text-red-500 ml-2 cursor-pointer" title="Clique para tentar novamente">
          <span>❌</span>
        </div>
      );
    
    default:
      return null;
  }
}; 