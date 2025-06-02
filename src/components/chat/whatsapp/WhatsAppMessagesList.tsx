
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Message } from "@/types/chat";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Check, CheckCheck } from "lucide-react";

interface WhatsAppMessagesListProps {
  messages: Message[];
  isLoading: boolean;
}

export const WhatsAppMessagesList = ({ messages, isLoading }: WhatsAppMessagesListProps) => {
  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0b141a]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0b141a] bg-whatsapp-chat-bg bg-opacity-5 relative">
      <ScrollArea className="h-full">
        <div className="p-4 space-y-2 min-h-full flex flex-col justify-end">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.isIncoming ? "justify-start" : "justify-end"
              )}
            >
              <div
                className={cn(
                  "max-w-[70%] rounded-lg p-3 shadow-md relative",
                  message.isIncoming 
                    ? "bg-[#202c33] text-[#e9edef] rounded-tl-none" 
                    : "bg-[#005c4b] text-[#e9edef] rounded-tr-none"
                )}
              >
                <p className="break-words">{message.text}</p>
                <div className={cn(
                  "flex items-center justify-end gap-1 mt-1 text-xs",
                  message.isIncoming ? "text-[#8696a0]" : "text-[#8ccc8c]"
                )}>
                  <span>{message.time}</span>
                  {!message.isIncoming && (
                    <div className="ml-1">
                      {message.status === "sent" && <Check className="h-3 w-3" />}
                      {message.status === "delivered" && <CheckCheck className="h-3 w-3" />}
                      {message.status === "read" && <CheckCheck className="h-3 w-3 text-[#53bdeb]" />}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {messages.length === 0 && !isLoading && (
            <div className="flex-1 flex items-center justify-center py-20">
              <div className="text-center text-[#8696a0]">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-lg">Inicie uma conversa</p>
                <p className="text-sm mt-2">Envie uma mensagem para começar</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
