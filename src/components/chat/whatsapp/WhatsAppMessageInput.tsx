import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuickMessagesPopover } from "./input/QuickMessagesPopover";
import { QuickActionsPopover } from "./input/QuickActionsPopover";
import { QuickMessagesPanel } from "./input/QuickMessagesPanel";
import { PhotoUploadDialog } from "./media/PhotoUploadDialog";
import { FileUploadDialog } from "./media/FileUploadDialog";
import { VideoUploadDialog } from "./media/VideoUploadDialog";
import { AudioRecordDialog } from "./media/AudioRecordDialog";

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
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [showAudioDialog, setShowAudioDialog] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage) {
      try {
        console.log('[WhatsAppMessageInput] ▶️ Enviando mensagem de texto...', {
          length: trimmedMessage.length,
          preview: trimmedMessage.substring(0, 50)
        });
        setMessage("");
        
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }

        const ok = await onSendMessage(trimmedMessage);
        console.log('[WhatsAppMessageInput] ✅ Resultado do envio (texto):', ok);
      } catch (error) {
        console.error('[WhatsAppMessageInput] Erro ao enviar mensagem:', error);
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

  const handleMediaSend = async (message: string, mediaType?: string, mediaUrl?: string): Promise<boolean> => {
    try {
      console.log('[WhatsAppMessageInput] ▶️ Enviando mídia...', {
        hasText: !!message?.trim(),
        mediaType,
        hasMediaUrl: !!mediaUrl,
        mediaUrlPreview: mediaUrl ? mediaUrl.substring(0, 50) + '...' : null
      });
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

      {/* ✅ TODOS OS DIALOGS DE MÍDIA */}
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

      <VideoUploadDialog
        open={showVideoDialog}
        onOpenChange={setShowVideoDialog}
        onSendMessage={handleMediaSend}
      />

      <AudioRecordDialog
        open={showAudioDialog}
        onOpenChange={setShowAudioDialog}
        onSendMessage={handleMediaSend}
      />

      <div className={cn(
        "p-4 border-t border-white/20",
        "bg-gradient-to-r from-white/10 via-white/5 to-white/10",
        "backdrop-blur-lg backdrop-saturate-150"
      )}>
        <div className="flex gap-3 items-end">
          {/* ✅ BOTÕES DE AÇÃO RÁPIDA - APENAS MÍDIA */}
          <div className="flex gap-1">
            <QuickActionsPopover 
              onSendMessage={handleMediaSend}
              onOpenPhotoDialog={() => setShowPhotoDialog(true)}
              onOpenFileDialog={() => setShowFileDialog(true)}
              onOpenVideoDialog={() => setShowVideoDialog(true)}
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
                "bg-white/80 backdrop-blur-sm border-white/40 text-gray-900",
                "focus:bg-white/90 focus:border-green-400/60 focus:ring-green-400/30",
                "placeholder:text-gray-500",
                "rounded-2xl px-4 py-3",
                "shadow-sm",
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
          
          {/* ✅ BOTÃO DE GRAVAÇÃO DE ÁUDIO */}
          <Button
            onClick={() => setShowAudioDialog(true)}
            disabled={isSending}
            size="lg"
            className={cn(
              "h-[44px] w-[44px] rounded-full p-0 transition-all duration-200",
              "bg-white/20 hover:bg-white/30 backdrop-blur-sm",
              "border border-white/30 hover:border-orange-200/50",
              "text-orange-600 hover:text-orange-700",
              "shadow-sm hover:shadow-md hover:scale-105",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            )}
          >
            <Mic className="h-5 w-5" />
          </Button>
          
          {/* ✅ BOTÃO DE ENVIAR */}
          <Button
            onClick={handleSend}
            disabled={!canSend || isSending}
            size="lg"
            className={cn(
              "h-[44px] w-[44px] rounded-full p-0 transition-all duration-200",
              canSend && !isSending
                ? "bg-gradient-to-r from-green-500/90 to-green-600/90 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl hover:scale-105 backdrop-blur-sm"
                : "bg-gray-300/80 text-gray-500 cursor-not-allowed backdrop-blur-sm"
            )}
          >
            {isSending ? (
              <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        
        {/* Indicador de envio */}
        {isSending && (
          <div className="flex items-center gap-2 mt-2 text-xs text-green-600/80">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span>Enviando...</span>
          </div>
        )}
      </div>
    </div>
  );
};
