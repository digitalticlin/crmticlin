
import React from 'react';
import { useWhatsAppChatContext } from './WhatsAppChatProvider';
import { Button } from '@/components/ui/button';
import { RefreshCw, Settings } from 'lucide-react';

export const WhatsAppChatActions = () => {
  const { fetchContacts, fetchMessages, selectedContact } = useWhatsAppChatContext();

  return (
    <div className="p-4 border-t bg-white">
      <div className="flex gap-2 justify-end">
        <Button 
          variant="outline" 
          size="sm"
          onClick={fetchContacts}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
        
        {selectedContact && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchMessages}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
        )}
      </div>
    </div>
  );
};
