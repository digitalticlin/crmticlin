
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Smile, Paperclip, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface WhatsAppMessageInputProps {
  onSendMessage: (message: string) => void;
  isSending: boolean;
}

const QUICK_MESSAGES = [
  "Olá! Como posso ajudá-lo?",
  "Obrigado pelo contato!",
  "Vou verificar para você.",
  "Posso ligar para você?",
  "Tem alguma dúvida?",
  "Aguardo seu retorno.",
  "Ótimo! Vamos prosseguir.",
  "Perfeito! Obrigado.",
];

const EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣",
  "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰",
  "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜",
  "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙",
  "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐",
  "🖖", "👋", "🤏", "✊", "👊", "🤛", "🤜", "💪"
];

export const WhatsAppMessageInput = ({
  onSendMessage,
  isSending
}: WhatsAppMessageInputProps) => {
  const [message, setMessage] = useState("");
  const [showQuickMessages, setShowQuickMessages] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim() && !isSending) {
      onSendMessage(message.trim());
      setMessage("");
      setShowQuickMessages(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickMessage = (quickMsg: string) => {
    setMessage(message + (message ? ' ' : '') + quickMsg);
    setShowQuickMessages(false);
    textareaRef.current?.focus();
  };

  const handleEmojiSelect = (emoji: string) => {
    const cursorPosition = textareaRef.current?.selectionStart || message.length;
    const newMessage = message.slice(0, cursorPosition) + emoji + message.slice(cursorPosition);
    setMessage(newMessage);
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(cursorPosition + emoji.length, cursorPosition + emoji.length);
        textareaRef.current.focus();
      }
    }, 0);
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="p-6 bg-white/10 backdrop-blur-md border-t border-white/20">
      {/* Quick Messages Bar */}
      {showQuickMessages && (
        <div className="mb-4 p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Mensagens Rápidas</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowQuickMessages(false)}
              className="text-gray-600 hover:text-gray-900 hover:bg-white/20 h-6 px-2 rounded-lg"
            >
              ✕
            </Button>
          </div>
          <ScrollArea className="max-h-32">
            <div className="grid gap-2">
              {QUICK_MESSAGES.map((quickMsg, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickMessage(quickMsg)}
                  className="justify-start text-left text-gray-700 hover:bg-white/30 hover:text-gray-900 h-8 px-3 rounded-lg transition-colors"
                >
                  {quickMsg}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Message Input */}
      <div className="flex items-end gap-3">
        {/* Quick Actions */}
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-600 hover:text-gray-900 hover:bg-white/20 w-12 h-12 rounded-full transition-colors"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" className="w-56 p-3 bg-white/90 backdrop-blur-md border-white/30 shadow-xl">
              <div className="grid gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowQuickMessages(!showQuickMessages)}
                  className="justify-start text-gray-700 hover:bg-white/50"
                >
                  💬 Mensagens Rápidas
                </Button>
                <Button variant="ghost" size="sm" className="justify-start text-gray-700 hover:bg-white/50">
                  <Paperclip className="h-4 w-4 mr-2" />
                  Anexar Arquivo
                </Button>
                <Button variant="ghost" size="sm" className="justify-start text-gray-700 hover:bg-white/50">
                  📷 Câmera
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Text Input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyPress={handleKeyPress}
            placeholder="Digite uma mensagem..."
            className="resize-none bg-white/20 backdrop-blur-sm border-white/30 text-gray-900 placeholder-gray-600 pr-20 min-h-[56px] max-h-[120px] rounded-2xl focus:bg-white/30 focus:border-white/40"
            rows={1}
          />
          
          {/* Emoji Button */}
          <div className="absolute right-3 bottom-3 flex gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10 text-gray-600 hover:text-gray-900 hover:bg-white/20 rounded-full"
                >
                  <Smile className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent side="top" className="w-80 p-4 bg-white/90 backdrop-blur-md border-white/30 shadow-xl">
                <ScrollArea className="h-48">
                  <div className="grid grid-cols-8 gap-2">
                    {EMOJIS.map((emoji, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEmojiSelect(emoji)}
                        className="h-10 w-10 p-0 hover:bg-white/50 text-lg rounded-lg"
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={!message.trim() || isSending}
          className={cn(
            "h-12 w-12 p-0 rounded-full transition-all duration-200 shadow-lg",
            message.trim() && !isSending
              ? "bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/25 hover:shadow-blue-500/40" 
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          )}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
