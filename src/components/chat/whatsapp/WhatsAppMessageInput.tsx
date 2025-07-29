
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuickMessagesPopover } from "./input/QuickMessagesPopover";
import { QuickActionsPopover } from "./input/QuickActionsPopover";
import { QuickMessagesPanel } from "./input/QuickMessagesPanel";
import { PhotoUploadDialog } from "./media/PhotoUploadDialog";
import { FileUploadDialog } from "./media/FileUploadDialog";

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
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [showFileDialog, setShowFileDialog] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage) {
      try {
        // Limpar campo imediatamente para UX mais rápido
        setMessage("");
        
        // Reset altura do textarea
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }

        await onSendMessage(trimmedMessage);
      } catch (error) {
        console.error('[WhatsAppMessageInput] Erro ao enviar mensagem:', error);
        // Se der erro, restaurar a mensagem
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
    
    // Focar no textarea após selecionar mensagem rápida
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // ✅ FUNÇÃO CORRIGIDA: Lidar com envio de mídia
  const handleMediaSend = async (message: string, mediaType?: string, mediaUrl?: string): Promise<boolean> => {
    try {
      return await onSendMessage(message, mediaType, mediaUrl);
    } catch (error) {
      console.error('[WhatsAppMessageInput] Erro ao enviar mídia:', error);
      return false;
    }
  };

  const canSend = message.trim().length > 0;

  return (
    <div className="relative">
      {/* Painel de Mensagens Rápidas */}
      {showQuickMessages && (
        <QuickMessagesPanel 
          onQuickMessage={handleQuickMessage}
          onClose={() => setShowQuickMessages(false)}
        />
      )}

      {/* ✅ DIALOGS DE MÍDIA ATIVADOS */}
      <PhotoUploadDialog
        open={showPhotoDialog}
        onOpenChange={setShowPhotoDialog}
        onSendMessage={handleMediaSend}
      />
      
      <FileUploadDialog
        open={showFileDialog}
        onOpenChange={setShowFileDialog}
        onSendMessage={handleMediaSend}
      />

      <div className="p-4 border-t border-white/20 bg-white/10 backdrop-blur-sm">
        <div className="flex gap-3 items-end">
          {/* Botões de Ação Rápida */}
          <div className="flex gap-1">
            <QuickActionsPopover 
              onSendMessage={handleMediaSend}
              onOpenPhotoDialog={() => setShowPhotoDialog(true)}
              onOpenFileDialog={() => setShowFileDialog(true)}
            />
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
            disabled={!canSend || isSending}
            size="lg"
            className={cn(
              "h-[44px] w-[44px] rounded-full p-0 transition-all duration-200",
              canSend && !isSending
                ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl hover:scale-105"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            )}
          >
            {isSending ? (
              <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        
        {/* Indicador discreto de mensagens sendo enviadas */}
        {isSending && (
          <div className="flex items-center gap-2 mt-1 text-xs text-green-600/70">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span>Enviando...</span>
          </div>
        )}
      </div>
    </div>
  );
};
