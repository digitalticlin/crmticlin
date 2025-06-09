
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Loader2, Plus } from "lucide-react";

interface SimplifiedConnectButtonProps {
  onConnect: () => Promise<void>;
  isConnecting: boolean;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
  text?: string;
}

export const SimplifiedConnectButton = ({ 
  onConnect, 
  isConnecting,
  variant = "default",
  size = "lg",
  text = "Conectar WhatsApp"
}: SimplifiedConnectButtonProps) => {
  const handleConnect = async () => {
    console.log('[Simplified Connect] 🚀 Iniciando conexão...');
    await onConnect();
  };

  // Se for variante pequena (botão adicionar), renderizar apenas o botão
  if (variant === "outline") {
    return (
      <Button 
        onClick={handleConnect}
        disabled={isConnecting}
        variant={variant}
        size={size}
        className="gap-2"
      >
        {isConnecting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Conectando...
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

  // Card completo para primeira conexão
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <div className="space-y-6">
          <div className="p-4 rounded-lg bg-green-100/50 dark:bg-green-900/30 inline-block">
            <MessageSquare className="h-12 w-12 text-green-600 mx-auto" />
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Conectar WhatsApp</h3>
            <p className="text-muted-foreground mb-6 text-sm">
              Conecte sua primeira instância WhatsApp para começar a gerenciar conversas automaticamente
            </p>
          </div>
          
          <Button 
            onClick={handleConnect}
            disabled={isConnecting}
            className="bg-green-600 hover:bg-green-700 text-white gap-2"
            size={size}
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <MessageSquare className="h-5 w-5" />
                {text}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
