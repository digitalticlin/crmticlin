
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Message } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Download, Play, Pause } from "lucide-react";
import { useState } from "react";

interface MessagesListProps {
  messages: Message[];
}

export const MessagesList = ({ messages }: MessagesListProps) => {
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  const renderMediaMessage = (message: Message) => {
    // Assumindo que mensagens de mídia terão um campo media_url no futuro
    const mediaUrl = (message as any).media_url;
    const mediaType = (message as any).media_type;
    
    if (!mediaUrl) return null;

    if (mediaType?.startsWith('image/')) {
      return (
        <div className="mt-2">
          <img 
            src={mediaUrl} 
            alt="Imagem compartilhada" 
            className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(mediaUrl, '_blank')}
          />
        </div>
      );
    }

    if (mediaType?.startsWith('video/')) {
      return (
        <div className="mt-2">
          <video 
            src={mediaUrl} 
            controls 
            className="max-w-xs rounded-lg"
            preload="metadata"
          />
        </div>
      );
    }

    if (mediaType?.startsWith('audio/')) {
      return (
        <div className="mt-2 flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg max-w-xs">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              if (playingAudio === message.id) {
                setPlayingAudio(null);
                // Pausar áudio
              } else {
                setPlayingAudio(message.id);
                // Reproduzir áudio
              }
            }}
          >
            {playingAudio === message.id ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <div className="flex-1">
            <div className="w-full bg-gray-300 dark:bg-gray-600 h-1 rounded-full">
              <div className="bg-blue-500 h-1 rounded-full w-0"></div>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">0:00</span>
        </div>
      );
    }

    // Outros tipos de arquivo
    return (
      <div className="mt-2 flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg max-w-xs">
        <div className="flex-1">
          <p className="text-sm font-medium truncate">
            {(message as any).fileName || 'Arquivo'}
          </p>
          <p className="text-xs text-muted-foreground">
            {mediaType || 'Documento'}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => window.open(mediaUrl, '_blank')}
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-3 min-h-full flex flex-col justify-end">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "max-w-[80%] rounded-lg p-3",
              message.isIncoming 
                ? "bg-white dark:bg-gray-800 self-start rounded-tl-none" 
                : "bg-primary text-primary-foreground self-end rounded-tr-none"
            )}
          >
            <p>{message.text}</p>
            
            {renderMediaMessage(message)}
            
            <div className={cn(
              "text-right text-xs mt-1",
              message.isIncoming ? "text-muted-foreground" : "text-primary-foreground/70"
            )}>
              {message.time}
              {!message.isIncoming && message.status && (
                <span className="ml-1">
                  {message.status === "sent" && "✓"}
                  {message.status === "delivered" && "✓✓"}
                  {message.status === "read" && "✓✓"}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
