
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile, Plus, Send, Mic, Paperclip } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/spinner";

interface WhatsAppMessageInputProps {
  onSendMessage: (message: string) => void;
  isSending: boolean;
}

export const WhatsAppMessageInput = ({ onSendMessage, isSending }: WhatsAppMessageInputProps) => {
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = () => {
    if (newMessage.trim() && !isSending) {
      onSendMessage(newMessage);
      setNewMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="p-4 bg-[#202c33] border-t border-[#313d45]">
      <div className="flex items-end gap-3">
        {/* Emoji Button */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942] shrink-0">
              <Smile className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-[#2a3942] border-[#313d45]" align="start">
            <div className="p-2 grid grid-cols-8 gap-2">
              {["😊", "😂", "❤️", "👍", "😍", "🙏", "👏", "🎉", "🤔", "😭", "🥳", "👋", "🔥", "💯", "⭐", "🚀"].map((emoji) => (
                <button
                  key={emoji}
                  className="p-2 hover:bg-[#313d45] rounded-md transition-colors"
                  onClick={() => setNewMessage(prev => prev + emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Attach Button */}
        <Button variant="ghost" size="icon" className="text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942] shrink-0">
          <Plus className="h-5 w-5" />
        </Button>
        
        {/* Message Input */}
        <div className="flex-1 bg-[#2a3942] rounded-lg">
          <Input
            className="border-none bg-transparent text-[#e9edef] placeholder-[#8696a0] focus:ring-0 focus:outline-none min-h-[44px] resize-none"
            placeholder="Digite uma mensagem"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
          />
        </div>
        
        {/* Send/Mic Button */}
        {newMessage.trim() ? (
          <Button
            variant="ghost"
            size="icon"
            className="text-[#00a884] hover:text-[#00a884] hover:bg-[#2a3942] shrink-0"
            onClick={handleSendMessage}
            disabled={isSending}
          >
            {isSending ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942] shrink-0">
            <Mic className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
};
