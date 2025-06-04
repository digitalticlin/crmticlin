
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Smile, Paperclip, Mic, Plus } from "lucide-react";
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
  "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏",
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
    
    // Restore cursor position
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
    <div className="p-4 bg-[#202c33] border-t border-[#313d45]">
      {/* Quick Messages Bar */}
      {showQuickMessages && (
        <div className="mb-3 p-3 bg-[#2a3942] rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#8696a0]">Mensagens Rápidas</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowQuickMessages(false)}
              className="text-[#8696a0] hover:text-[#e9edef] h-6 px-2"
            >
              ✕
            </Button>
          </div>
          <ScrollArea className="max-h-32">
            <div className="grid gap-1">
              {QUICK_MESSAGES.map((quickMsg, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickMessage(quickMsg)}
                  className="justify-start text-left text-[#e9edef] hover:bg-[#313d45] h-8 px-2"
                >
                  {quickMsg}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Message Input */}
      <div className="flex items-end gap-2">
        {/* Quick Actions */}
        <div className="flex gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]">
                <Plus className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" className="w-48 p-2 bg-[#2a3942] border-[#313d45]">
              <div className="grid gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowQuickMessages(!showQuickMessages)}
                  className="justify-start text-[#e9edef] hover:bg-[#313d45]"
                >
                  💬 Mensagens Rápidas
                </Button>
                <Button variant="ghost" size="sm" className="justify-start text-[#e9edef] hover:bg-[#313d45]">
                  <Paperclip className="h-4 w-4 mr-2" />
                  Anexar Arquivo
                </Button>
                <Button variant="ghost" size="sm" className="justify-start text-[#e9edef] hover:bg-[#313d45]">
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
            className="resize-none bg-[#2a3942] border-[#313d45] text-[#e9edef] placeholder-[#8696a0] pr-20 min-h-[44px] max-h-[120px]"
            rows={1}
          />
          
          {/* Emoji Button */}
          <div className="absolute right-2 bottom-2 flex gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#8696a0] hover:text-[#e9edef]">
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent side="top" className="w-80 p-3 bg-[#2a3942] border-[#313d45]">
                <ScrollArea className="h-48">
                  <div className="grid grid-cols-8 gap-1">
                    {EMOJIS.map((emoji, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEmojiSelect(emoji)}
                        className="h-8 w-8 p-0 hover:bg-[#313d45] text-lg"
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

        {/* Send/Voice Button */}
        {message.trim() ? (
          <Button
            onClick={handleSend}
            disabled={isSending}
            className="bg-[#00a884] hover:bg-[#008f72] text-white h-11 w-11 p-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942] h-11 w-11">
            <Mic className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
};
