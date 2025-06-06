
import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowRight, Clock } from "lucide-react";

interface GlassmorphismChatPreviewProps {
  lastMessage?: string;
  lastMessageTime?: string;
  onOpenChat: () => void;
}

export const GlassmorphismChatPreview = ({
  lastMessage,
  lastMessageTime,
  onOpenChat
}: GlassmorphismChatPreviewProps) => {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-lime-400/30 shadow-xl shadow-lime-400/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white/90 font-medium flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-lime-400/80 to-yellow-300/80 rounded-xl shadow-lg shadow-lime-400/30">
            <MessageCircle className="h-5 w-5 text-black" />
          </div>
          Prévia do Chat
        </h3>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onOpenChat}
          className="bg-gradient-to-r from-lime-400/20 to-yellow-300/20 hover:from-lime-400/30 hover:to-yellow-300/30 text-lime-300 border border-lime-400/40 backdrop-blur-sm rounded-xl transition-all duration-200 hover:scale-105 shadow-lg shadow-lime-400/20"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
        {lastMessage ? (
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 backdrop-blur-sm rounded-lg p-3 border border-blue-400/30">
              <p className="text-white/90 text-sm leading-relaxed">
                {lastMessage}
              </p>
            </div>
            
            {lastMessageTime && (
              <div className="flex items-center gap-2 text-white/60 text-xs">
                <Clock className="h-3 w-3 text-lime-400" />
                <span>Última mensagem: {lastMessageTime}</span>
              </div>
            )}
            
            <Button
              onClick={onOpenChat}
              className="w-full bg-gradient-to-r from-lime-400/90 to-yellow-300/90 backdrop-blur-sm text-black font-semibold hover:from-lime-500/90 hover:to-yellow-400/90 shadow-lg shadow-lime-400/30 hover:shadow-lime-400/50 transition-all duration-200 hover:scale-[1.02] rounded-xl"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Abrir Conversa
            </Button>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="text-white/50 text-sm mb-4">
              Nenhuma mensagem encontrada
            </div>
            <Button
              onClick={onOpenChat}
              variant="outline"
              className="bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20 hover:text-white shadow-lg transition-all duration-200"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Iniciar Conversa
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
