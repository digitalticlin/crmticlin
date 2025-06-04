
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

  // SVG pattern for watermark background
  const watermarkPattern = `data:image/svg+xml;base64,${btoa(`
    <svg width="120" height="120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="whatsapp-icons" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
          <!-- Phone icon -->
          <g transform="translate(10, 10)" stroke="currentColor" stroke-width="1" fill="none" opacity="0.03">
            <path d="m22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </g>
          
          <!-- Message icon -->
          <g transform="translate(70, 70)" stroke="currentColor" stroke-width="1" fill="none" opacity="0.03">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </g>
          
          <!-- Camera icon -->
          <g transform="translate(70, 10)" stroke="currentColor" stroke-width="1" fill="none" opacity="0.02">
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
            <circle cx="12" cy="13" r="3"/>
          </g>
          
          <!-- Send icon -->
          <g transform="translate(10, 70)" stroke="currentColor" stroke-width="1" fill="none" opacity="0.02">
            <path d="m22 2-7 20-4-9-9-4Z"/>
            <path d="M22 2 11 13"/>
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#whatsapp-icons)"/>
    </svg>
  `)}`;

  return (
    <div className="flex-1 bg-white/5 backdrop-blur-sm relative overflow-hidden">
      {/* Watermark background pattern */}
      <div 
        className="absolute inset-0 opacity-100 text-gray-400"
        style={{
          backgroundImage: `url("${watermarkPattern}")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '120px 120px'
        }}
      ></div>
      
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
                    ? "bg-white/60 text-gray-900 rounded-bl-md border border-white/30" 
                    : "bg-green-500/40 border-2 border-green-500 text-white rounded-br-md shadow-green-500/25"
                )}
              >
                <p className="break-words leading-relaxed">{message.text}</p>
                <div className={cn(
                  "flex items-center justify-end gap-2 mt-2 text-xs",
                  message.isIncoming ? "text-gray-500" : "text-green-100"
                )}>
                  <span className="font-medium">{message.time}</span>
                  {!message.isIncoming && (
                    <div className="ml-1">
                      {message.status === "sent" && <Check className="h-4 w-4" />}
                      {message.status === "delivered" && <CheckCheck className="h-4 w-4" />}
                      {message.status === "read" && <CheckCheck className="h-4 w-4 text-green-200" />}
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
