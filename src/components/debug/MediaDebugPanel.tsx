import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWhatsAppChatMessages } from '@/hooks/whatsapp/chat/useWhatsAppChatMessages';
import { Contact } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';

interface MediaDebugPanelProps {
  selectedContact: Contact | null;
  activeInstance: WhatsAppWebInstance | null;
}

export const MediaDebugPanel: React.FC<MediaDebugPanelProps> = ({
  selectedContact,
  activeInstance
}) => {
  const { messages } = useWhatsAppChatMessages(selectedContact, activeInstance);
  
  // Filtrar mensagens que têm mídia
  const mediaMessages = messages.filter(msg => 
    msg.mediaType !== 'text' || msg.hasMediaCache || msg.mediaCacheId
  );

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    return `${(bytes / 1024).toFixed(1)}KB`;
  };

  const getMediaStatus = (message: any) => {
    if (message.mediaType !== 'text' && message.mediaUrl) {
      return { status: 'OK', color: 'bg-green-500' };
    }
    if (message.hasMediaCache) {
      return { status: 'CACHE_ONLY', color: 'bg-yellow-500' };
    }
    return { status: 'MISSING', color: 'bg-red-500' };
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Debug de Mídias do WhatsApp
          <Badge variant="outline">{mediaMessages.length} mídias encontradas</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!selectedContact ? (
          <p className="text-muted-foreground">Selecione um contato para debugar mídias</p>
        ) : mediaMessages.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma mídia encontrada para este contato</p>
        ) : (
          <div className="space-y-4">
            {mediaMessages.map((message) => {
              const status = getMediaStatus(message);
              return (
                <div key={message.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={`${status.color} text-white`}>
                        {status.status}
                      </Badge>
                      <Badge variant="outline">{message.mediaType}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {message.time}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {message.hasMediaCache && (
                        <Badge variant="secondary">HAS_CACHE</Badge>
                      )}
                      {message.mediaCacheId && (
                        <Badge variant="outline">ID: {message.mediaCacheId.slice(0, 8)}</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Texto:</strong> {message.text || 'N/A'}
                    </div>
                    <div>
                      <strong>De mim:</strong> {message.fromMe ? 'Sim' : 'Não'}
                    </div>
                    <div>
                      <strong>Media URL:</strong> 
                      {message.mediaUrl ? (
                        <span className="ml-2 text-blue-600 truncate max-w-xs inline-block">
                          {message.mediaUrl.length > 50 ? 
                            `${message.mediaUrl.substring(0, 50)}...` : 
                            message.mediaUrl
                          }
                        </span>
                      ) : (
                        <span className="ml-2 text-red-500">Não definida</span>
                      )}
                    </div>
                    <div>
                      <strong>Cache ID:</strong> {message.mediaCacheId || 'N/A'}
                    </div>
                  </div>

                  {message.mediaUrl && message.mediaType === 'image' && (
                    <div className="mt-2">
                      <strong>Preview:</strong>
                      <img 
                        src={message.mediaUrl} 
                        alt="Preview" 
                        className="mt-1 max-w-xs max-h-32 object-contain border rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 