
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
      <div className="flex-1 flex items-center justify-center bg-white/5 backdrop-blur-sm">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white/5 backdrop-blur-sm relative overflow-hidden">
      {/* Pattern de fundo sutil */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[length:30px_30px]"></div>
      </div>
      
      <ScrollArea className="h-full relative z-10">
        <div className="p-6 space-y-4 min-h-full flex flex-col justify-end">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex animate-fade-in",
                message.isIncoming ? "justify-start" : "justify-end"
              )}
            >
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl p-4 shadow-lg relative backdrop-blur-sm",
                  message.isIncoming 
                    ? "bg-white/90 text-gray-900 rounded-bl-md border border-white/20" 
                    : "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md shadow-blue-500/25"
                )}
              >
                <p className="break-words leading-relaxed">{message.text}</p>
                <div className={cn(
                  "flex items-center justify-end gap-2 mt-2 text-xs",
                  message.isIncoming ? "text-gray-500" : "text-blue-100"
                )}>
                  <span className="font-medium">{message.time}</span>
                  {!message.isIncoming && (
                    <div className="ml-1">
                      {message.status === "sent" && <Check className="h-4 w-4" />}
                      {message.status === "delivered" && <CheckCheck className="h-4 w-4" />}
                      {message.status === "read" && <CheckCheck className="h-4 w-4 text-blue-200" />}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {messages.length === 0 && !isLoading && (
            <div className="flex-1 flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-4xl">💬</div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Inicie uma conversa</h3>
                <p className="text-gray-600">Envie uma mensagem para começar a conversar</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
