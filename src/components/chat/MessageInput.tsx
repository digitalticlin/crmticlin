
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile, Paperclip, Send, Image, File, Mic } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/spinner";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isSending?: boolean;
}

export const MessageInput = ({ onSendMessage, isSending = false }: MessageInputProps) => {
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = () => {
    if (newMessage.trim() && !isSending) {
      onSendMessage(newMessage);
      setNewMessage("");
    }
  };

  return (
    <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex items-end gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0">
            <Smile className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="p-2 grid grid-cols-8 gap-2">
            {["😊", "😂", "👍", "❤️", "😍", "🙏", "👏", "🎉", "🤔", "😭", "🥳", "👋", "🔥", "💯", "⭐", "🚀"].map((emoji) => (
              <button
                key={emoji}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                onClick={() => setNewMessage(prev => prev + emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0">
            <Paperclip className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48" align="start">
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start">
              <Image className="h-4 w-4 mr-2" />
              Imagem
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <File className="h-4 w-4 mr-2" />
              Documento
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Mic className="h-4 w-4 mr-2" />
              Áudio
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      
      <Input
        className="flex-1"
        placeholder="Digite uma mensagem"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
        disabled={isSending}
      />
      
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 text-ticlin"
        onClick={handleSendMessage}
        disabled={!newMessage.trim() || isSending}
      >
        {isSending ? (
          <LoadingSpinner size="sm" />
        ) : (
          <Send className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
};
