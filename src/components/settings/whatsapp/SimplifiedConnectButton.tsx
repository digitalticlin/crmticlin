
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimplifiedConnectButtonProps {
  onConnect: () => Promise<void>;
  isConnecting: boolean;
  variant?: "default" | "outline";
  size?: "sm" | "default" | "lg";
  text?: string;
}

export function SimplifiedConnectButton({ 
  onConnect, 
  isConnecting,
  variant = "default",
  size = "default",
  text = "Conectar WhatsApp"
}: SimplifiedConnectButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    
    try {
      console.log('[SimplifiedConnect] 🚀 CORREÇÃO: Iniciando conexão...');
      await onConnect();
      console.log('[SimplifiedConnect] ✅ CORREÇÃO: Conexão concluída');
    } catch (error: any) {
      console.error('[SimplifiedConnect] ❌ CORREÇÃO: Erro na conexão:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loading = isConnecting || isLoading;

  // Se é um botão pequeno/outline, renderizar apenas o botão
  if (variant === "outline" || size === "sm") {
    return (
      <Button 
        onClick={handleConnect}
        disabled={loading}
        variant={variant}
        size={size}
        className="gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {isConnecting ? 'Conectando...' : 'Criando...'}
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            {text}
          </>
        )}
      </Button>
    );
  }

  // Card principal com efeito glassmorphism
  return (
    <Card className={cn(
      "relative overflow-hidden border-0 bg-white/10 backdrop-blur-md",
      "shadow-xl hover:shadow-2xl transition-all duration-300",
      "bg-gradient-to-br from-white/20 to-white/5",
      "hover:from-white/30 hover:to-white/10"
    )}>
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 p-4 rounded-2xl bg-green-500/20 backdrop-blur-sm w-fit">
          <MessageSquare className="h-12 w-12 text-green-600" />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-800">
          Conectar WhatsApp Web
        </CardTitle>
        <p className="text-gray-600 mt-2">
          Crie sua primeira conexão WhatsApp para começar a automatizar mensagens
        </p>
      </CardHeader>
      
      <CardContent className="text-center pb-8">
        <Button 
          onClick={handleConnect}
          disabled={loading}
          size="lg"
          className={cn(
            "w-full max-w-xs mx-auto h-12 text-lg font-semibold",
            "bg-green-600 hover:bg-green-700 text-white",
            "shadow-lg hover:shadow-xl transition-all duration-200",
            "border-0 backdrop-blur-sm"
          )}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              {isConnecting ? 'Conectando...' : 'Criando...'}
            </>
          ) : (
            <>
              <MessageSquare className="h-5 w-5 mr-2" />
              Conectar Agora
            </>
          )}
        </Button>
        
        <p className="text-sm text-gray-500 mt-4">
          O processo é seguro e leva apenas alguns segundos
        </p>
      </CardContent>
    </Card>
  );
}
