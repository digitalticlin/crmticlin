
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2 } from "lucide-react";

interface ConnectWhatsAppButtonProps {
  onConnect: () => Promise<void>;
  isConnecting: boolean;
}

export function ConnectWhatsAppButton({ onConnect, isConnecting }: ConnectWhatsAppButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      await onConnect();
    } catch (error) {
      console.error('Error connecting WhatsApp:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loading = isConnecting || isLoading;

  return (
    <div className="glass-card border-0 p-6 text-center">
      <div className="p-4 rounded-lg bg-green-100/50 dark:bg-green-900/30 inline-block mb-4">
        <MessageSquare className="h-12 w-12 text-green-600 mx-auto" />
      </div>
      
      <h3 className="text-lg font-medium mb-2">Conectar WhatsApp Web.js</h3>
      
      <p className="text-muted-foreground mb-4 text-sm">
        Crie sua primeira instância WhatsApp para começar a usar o sistema
      </p>
      
      <Button 
        onClick={handleConnect}
        disabled={loading}
        className="bg-green-600 hover:bg-green-700 text-white"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {isConnecting ? 'Conectando...' : 'Criando...'}
          </>
        ) : (
          <>
            <MessageSquare className="h-4 w-4 mr-2" />
            Conectar WhatsApp
          </>
        )}
      </Button>
    </div>
  );
}
