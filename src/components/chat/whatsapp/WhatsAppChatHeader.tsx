
import React from 'react';
import { useWhatsAppChatContext } from './WhatsAppChatProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Phone, Video, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const WhatsAppChatHeader = () => {
  const { selectedContact, instanceHealth } = useWhatsAppChatContext();

  return (
    <div className="flex items-center justify-between p-4 border-b bg-white">
      <div className="flex items-center gap-3">
        {selectedContact ? (
          <>
            <Avatar>
              <AvatarImage src={selectedContact.avatar} />
              <AvatarFallback>
                {selectedContact.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">{selectedContact.name}</h3>
              <p className="text-sm text-gray-500">{selectedContact.phone}</p>
            </div>
          </>
        ) : (
          <div>
            <h3 className="font-medium">WhatsApp Chat</h3>
            <p className="text-sm text-gray-500">Selecione um contato</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Badge variant={instanceHealth.isHealthy ? "default" : "destructive"}>
          {instanceHealth.connectedInstances}/{instanceHealth.totalInstances} conectado
        </Badge>
        
        {selectedContact && (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
