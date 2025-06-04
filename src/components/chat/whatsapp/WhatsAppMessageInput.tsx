
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuickMessagesPanel } from "./input/QuickMessagesPanel";
import { EmojiPicker } from "./input/EmojiPicker";
import { QuickActionsPopover } from "./input/QuickActionsPopover";
import { QuickMessagesPopover } from "./input/QuickMessagesPopover";

interface WhatsAppMessageInputProps {
  onSendMessage: (message: string) => void;
  isSending: boolean;
}

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
      {/* Quick Messages Panel - mantido para compatibilidade */}
      {showQuickMessages && (
        <QuickMessagesPanel
          onQuickMessage={handleQuickMessage}
          onClose={() => setShowQuickMessages(false)}
        />
      )}

      {/* Message Input */}
      <div className="flex items-end gap-3">
        {/* Actions - Separados em dois botões */}
        <div className="flex gap-2">
          <QuickActionsPopover />
          <QuickMessagesPopover onQuickMessage={handleQuickMessage} />
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
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
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
