
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

interface ChatPreviewProps {
  lastMessage: string;
  lastMessageTime: string;
  onOpenChat: () => void;
}

export const ChatPreview = ({ 
  lastMessage, 
  lastMessageTime,
  onOpenChat 
}: ChatPreviewProps) => {
  return (
    <div>
      <h3 className="text-sm font-medium mb-2 flex items-center">
        <MessageSquare className="h-4 w-4 mr-1" /> Conversa
      </h3>
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex justify-between items-start mb-2">
          <span className="text-sm font-medium">{lastMessageTime}</span>
          <span className="text-xs text-muted-foreground">WhatsApp</span>
        </div>
        <p className="text-sm">{lastMessage}</p>
      </div>
      
      <Button 
        className="w-full mt-2 bg-ticlin hover:bg-ticlin/90 text-black"
        onClick={onOpenChat}
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Abrir Chat Completo
      </Button>
    </div>
  );
};
