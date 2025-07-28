
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, CheckCircle, XCircle, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuickMessagesPopover } from "./input/QuickMessagesPopover";
import { QuickActionsPopover } from "./input/QuickActionsPopover";
import { QuickMessagesPanel } from "./input/QuickMessagesPanel";

interface WhatsAppMessageInputProps {
  onSendMessage: (message: string, mediaType?: string, mediaUrl?: string) => Promise<boolean>;
  isSending: boolean;
  realtimeStats?: {
    isConnected: boolean;
    connectionAttempts: number;
    maxAttempts: number;
  };
}

export const WhatsAppMessageInput = ({ 
  onSendMessage, 
  isSending,
  realtimeStats
}: WhatsAppMessageInputProps) => {
  const [message, setMessage] = useState("");
  const [showQuickMessages, setShowQuickMessages] = useState(false);
  const [lastSendStatus, setLastSendStatus] = useState<'success' | 'error' | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !isSending) {
      try {
        console.log('[MessageInput] 📤 Enviando mensagem:', {
          length: trimmedMessage.length,
          preview: trimmedMessage.substring(0, 30) + '...'
        });

        // ✅ LIMPAR CAMPO IMEDIATAMENTE
        setMessage("");
        setLastSendStatus(null);
        
        // Reset altura do textarea
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }

        const success = await onSendMessage(trimmedMessage);
        
        if (success) {
          setLastSendStatus('success');
          console.log('[MessageInput] ✅ Mensagem enviada com sucesso');
          
          // Limpar status após 2 segundos
          setTimeout(() => setLastSendStatus(null), 2000);
        } else {
          setLastSendStatus('error');
          // Restaurar mensagem em caso de erro
          setMessage(trimmedMessage);
          console.error('[MessageInput] ❌ Falha no envio');
        }
      } catch (error) {
        console.error('[MessageInput] ❌ Erro ao enviar mensagem:', error);
        setLastSendStatus('error');
        setMessage(trimmedMessage);
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
        {/* ✅ INDICADOR DE STATUS DO REALTIME */}
        {realtimeStats && (
          <div className="mb-2 flex items-center gap-2 text-xs">
            {realtimeStats.isConnected ? (
              <div className="flex items-center gap-1 text-green-600">
                <Wifi className="h-3 w-3" />
                <span>Conectado</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-orange-600">
                <WifiOff className="h-3 w-3" />
                <span>Reconectando... ({realtimeStats.connectionAttempts}/{realtimeStats.maxAttempts})</span>
              </div>
            )}
          </div>
        )}

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
              disabled={isSending}
              className={cn(
                "min-h-[44px] max-h-[120px] resize-none",
                "bg-white/70 backdrop-blur-sm border-white/30 text-gray-900",
                "focus:bg-white/80 focus:border-green-400/50 focus:ring-green-400/30",
                "placeholder:text-gray-500",
                "rounded-2xl px-4 py-3",
                "transition-all duration-200",
                isSending && "opacity-50 cursor-not-allowed"
              )}
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
            ) : lastSendStatus === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-200" />
            ) : lastSendStatus === 'error' ? (
              <XCircle className="h-5 w-5 text-red-200" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        
        {/* ✅ FEEDBACK VISUAL MELHORADO */}
        <div className="mt-2 min-h-[20px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isSending && (
              <div className="flex items-center gap-2 text-xs text-green-600/70">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span>Enviando...</span>
              </div>
            )}
            
            {lastSendStatus === 'success' && (
              <div className="flex items-center gap-2 text-xs text-green-600">
                <CheckCircle className="h-3 w-3" />
                <span>Mensagem enviada</span>
              </div>
            )}
            
            {lastSendStatus === 'error' && (
              <div className="flex items-center gap-2 text-xs text-red-600">
                <XCircle className="h-3 w-3" />
                <span>Erro no envio</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
