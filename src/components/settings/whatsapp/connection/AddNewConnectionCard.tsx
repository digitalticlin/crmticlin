
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";

interface AddNewConnectionCardProps {
  onConnect: () => void;
  isConnecting: boolean;
}

export const AddNewConnectionCard = ({ onConnect, isConnecting }: AddNewConnectionCardProps) => {
  return (
    <Card className="group relative transition-all duration-300 hover:shadow-2xl hover:-translate-y-1
      bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl 
      border-2 border-dashed border-green-300/70 rounded-2xl overflow-hidden
      cursor-pointer min-h-[280px] flex items-center justify-center" 
      onClick={!isConnecting ? onConnect : undefined}>
      
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      
      <CardContent className="p-6 text-center relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full 
          bg-gradient-to-br from-green-400/30 to-green-600/30 backdrop-blur-sm mb-4
          group-hover:scale-110 transition-transform duration-200">
          {isConnecting ? (
            <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
          ) : (
            <Plus className="h-8 w-8 text-green-600" />
          )}
        </div>
        
        <h3 className="font-semibold text-gray-800 mb-2">Nova Conexão</h3>
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          Conecte mais uma conta WhatsApp com QR automático
        </p>
        
        <Button
          onClick={onConnect}
          disabled={isConnecting}
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 
            text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
        >
          {isConnecting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Conectando...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Conectar (Auto QR)
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
