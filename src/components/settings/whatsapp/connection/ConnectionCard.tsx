
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2 } from "lucide-react";

interface ConnectionCardProps {
  onConnect: () => void;
  isConnecting: boolean;
}

export const ConnectionCard = ({ onConnect, isConnecting }: ConnectionCardProps) => {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-green-50/80 to-green-100/60 
      backdrop-blur-xl border-2 border-dashed border-green-300/70 rounded-3xl 
      hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
      
      <CardContent className="p-10 text-center relative z-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full 
          bg-gradient-to-br from-green-400/30 to-green-600/30 backdrop-blur-sm mb-6
          ring-4 ring-green-200/50">
          <MessageSquare className="h-10 w-10 text-green-600" />
        </div>
        
        <h3 className="text-2xl font-bold mb-3 text-gray-800">Conectar WhatsApp</h3>
        <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
          Conecte sua conta WhatsApp para começar a enviar e receber mensagens 
          de forma integrada com seu sistema. O QR Code será gerado automaticamente!
        </p>
        
        <Button
          onClick={onConnect}
          disabled={isConnecting}
          size="lg"
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 
            text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl 
            transition-all duration-200 disabled:opacity-50"
        >
          {isConnecting ? (
            <>
              <Loader2 className="h-5 w-5 mr-3 animate-spin" />
              Conectando e preparando QR...
            </>
          ) : (
            <>
              <MessageSquare className="h-5 w-5 mr-3" />
              Conectar WhatsApp (Automático)
            </>
          )}
        </Button>
        
        {isConnecting && (
          <p className="text-sm text-gray-500 mt-4">
            O QR Code aparecerá automaticamente quando estiver pronto
          </p>
        )}
      </CardContent>
    </Card>
  );
};
