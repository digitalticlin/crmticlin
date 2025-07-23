
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuickMessagesPopover } from "./input/QuickMessagesPopover";
import { QuickActionsPopover } from "./input/QuickActionsPopover";
import { QuickMessagesPanel } from "./input/QuickMessagesPanel";

interface WhatsAppMessageInputProps {
  onSendMessage: (message: string, mediaType?: string, mediaUrl?: string) => Promise<boolean>;
  isSending: boolean;
}

export const WhatsAppMessageInput = ({ 
  onSendMessage, 
  isSending 
}: WhatsAppMessageInputProps) => {
  const [message, setMessage] = useState("");
  const [showQuickMessages, setShowQuickMessages] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !isSending) {
      try {
        await onSendMessage(trimmedMessage);
      setMessage("");
      
      // Reset altura do textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        }
      } catch (error) {
        console.error('[WhatsAppMessageInput] Erro ao enviar mensagem:', error);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    textarea.style.height = Math.min(scrollHeight, 120) + 'px';
  };

  const handleQuickMessage = (quickMsg: string) => {
    setMessage(quickMsg);
    setShowQuickMessages(false);
    
    // Focar no textarea após selecionar mensagem rápida
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const canSend = message.trim().length > 0 && !isSending;

  return (
    <div className="relative">
      {/* Painel de Mensagens Rápidas */}
      {showQuickMessages && (
        <QuickMessagesPanel 
          onQuickMessage={handleQuickMessage}
          onClose={() => setShowQuickMessages(false)}
        />
      )}

      <div className="p-4 border-t border-white/20 bg-white/10 backdrop-blur-sm">
        <div className="flex gap-3 items-end">
          {/* Botões de Ação Rápida */}
          <div className="flex gap-1">
            <QuickActionsPopover onSendMessage={onSendMessage} />
            <QuickMessagesPopover 
              onQuickMessage={handleQuickMessage}
            />
          </div>
          
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyPress={handleKeyPress}
              placeholder="Digite uma mensagem..."
              className={cn(
                "min-h-[44px] max-h-[120px] resize-none",
                "bg-white/70 backdrop-blur-sm border-white/30 text-gray-900",
                "focus:bg-white/80 focus:border-green-400/50 focus:ring-green-400/30",
                "placeholder:text-gray-500",
                "rounded-2xl px-4 py-3",
                "transition-all duration-200"
              )}
              disabled={isSending}
            />
            
            {/* Contador de caracteres */}
            {message.length > 800 && (
              <div className={cn(
                "absolute bottom-2 right-3 text-xs",
                message.length > 1000 ? "text-red-500" : "text-yellow-600"
              )}>
                {message.length}/1500
              </div>
            )}
          </div>
          
          <Button
            onClick={handleSend}
            disabled={!canSend}
            size="lg"
            className={cn(
              "h-[44px] w-[44px] rounded-full p-0 transition-all duration-200",
              canSend
                ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl hover:scale-105"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            )}
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        
        {/* Indicador de digitação */}
        {isSending && (
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>Enviando mensagem...</span>
          </div>
        )}
      </div>
    </div>
  );
};
