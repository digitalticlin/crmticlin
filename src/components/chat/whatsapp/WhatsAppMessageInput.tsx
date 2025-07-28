
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuickMessagesPopover } from "./input/QuickMessagesPopover";
import { QuickActionsPopover } from "./input/QuickActionsPopover";
import { QuickMessagesPanel } from "./input/QuickMessagesPanel";
import { useMessagesRealtime } from "@/hooks/whatsapp/realtime/useMessagesRealtime";

interface WhatsAppMessageInputProps {
  onSendMessage: (message: string, mediaType?: string, mediaUrl?: string) => Promise<boolean>;
  isSending: boolean;
  selectedContact?: any;
  activeInstance?: any;
}

export const WhatsAppMessageInput = ({ 
  onSendMessage, 
  isSending,
  selectedContact,
  activeInstance
}: WhatsAppMessageInputProps) => {
  const [message, setMessage] = useState("");
  const [showQuickMessages, setShowQuickMessages] = useState(false);
  const [sendingStatus, setSendingStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ✅ MONITORAR STATUS DE CONEXÃO REALTIME OTIMIZADO
  const { isConnected, reconnectAttempts } = useMessagesRealtime({
    selectedContact,
    activeInstance,
    onNewMessage: () => {}, // Não fazer nada aqui, já é tratado no hook principal
    onMessageUpdate: () => {}
  });

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !isSending) {
      try {
        setSendingStatus('sending');
        
        // ✅ LIMPAR CAMPO IMEDIATAMENTE para UX mais rápido
        setMessage("");
        
        // Reset altura do textarea
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }

        const success = await onSendMessage(trimmedMessage);
        
        if (success) {
          setSendingStatus('success');
          setTimeout(() => setSendingStatus('idle'), 2000);
        } else {
          setSendingStatus('error');
          // ✅ Se der erro, restaurar a mensagem
          setMessage(trimmedMessage);
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
          setTimeout(() => setSendingStatus('idle'), 3000);
        }
      } catch (error) {
        console.error('[WhatsAppMessageInput] Erro ao enviar mensagem:', error);
        setSendingStatus('error');
        // ✅ Restaurar a mensagem em caso de erro
        setMessage(trimmedMessage);
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
        setTimeout(() => setSendingStatus('idle'), 3000);
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
        {/* ✅ INDICADOR DE STATUS DE CONEXÃO OTIMIZADO */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs">
            {isConnected ? (
              <>
                <Wifi className="h-3 w-3 text-green-400" />
                <span className="text-green-400">Conectado</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-red-400" />
                <span className="text-red-400">
                  Reconectando... 
                  {reconnectAttempts > 0 && `(${reconnectAttempts})`}
                </span>
              </>
            )}
          </div>
          
          {/* ✅ FEEDBACK VISUAL MELHORADO */}
          <div className="flex items-center gap-2 text-xs">
            {sendingStatus === 'sending' && (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-blue-400">Enviando...</span>
              </>
            )}
            {sendingStatus === 'success' && (
              <span className="text-green-400">✓ Enviado</span>
            )}
            {sendingStatus === 'error' && (
              <span className="text-red-400">✗ Erro no envio</span>
            )}
          </div>
        </div>

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
                "min-h-[44px] max-h-[120px] resize-none transition-all duration-200",
                "bg-white/70 backdrop-blur-sm border-white/30 text-gray-900",
                "focus:bg-white/80 focus:border-blue-400/50 focus:ring-blue-400/30",
                "placeholder:text-gray-500 rounded-2xl px-4 py-3",
                isSending && "opacity-50 cursor-not-allowed",
                sendingStatus === 'error' && "border-red-400/50 focus:border-red-400/50"
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
                ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-105"
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
      </div>
    </div>
  );
};
