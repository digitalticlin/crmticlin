
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, Loader2, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { useRetryableOperation } from "@/hooks/whatsapp/useRetryableOperation";
import { toast } from "sonner";

interface ImprovedConnectWhatsAppButtonProps {
  onConnect: () => Promise<void>;
  isConnecting: boolean;
}

export function ImprovedConnectWhatsAppButton({ 
  onConnect, 
  isConnecting 
}: ImprovedConnectWhatsAppButtonProps) {
  const [connectionStage, setConnectionStage] = useState<string>("");
  
  const retryableConnect = useRetryableOperation(
    async () => {
      setConnectionStage("Verificando servidor VPS...");
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setConnectionStage("Criando instância WhatsApp...");
      await onConnect();
      
      setConnectionStage("Instância criada com sucesso!");
      return true;
    },
    {
      maxRetries: 2,
      delayMs: 2000,
      backoffMultiplier: 1.5
    }
  );

  const handleConnect = async () => {
    setConnectionStage("");
    const result = await retryableConnect.execute();
    
    if (result) {
      setTimeout(() => {
        setConnectionStage("");
        retryableConnect.reset();
      }, 2000);
    }
  };

  const getConnectionProgress = () => {
    if (retryableConnect.isLoading || isConnecting) {
      if (connectionStage.includes("Verificando")) return 25;
      if (connectionStage.includes("Criando")) return 75;
      if (connectionStage.includes("sucesso")) return 100;
      return 10;
    }
    return 0;
  };

  const isLoading = retryableConnect.isLoading || isConnecting;

  return (
    <div className="glass-card border-0 p-6 text-center space-y-4">
      <div className="p-4 rounded-lg bg-green-100/50 dark:bg-green-900/30 inline-block">
        <MessageSquare className="h-12 w-12 text-green-600 mx-auto" />
      </div>
      
      <h3 className="text-lg font-medium">Conectar WhatsApp Web.js</h3>
      
      <p className="text-muted-foreground text-sm">
        Crie sua primeira instância WhatsApp com retry automático
      </p>

      {retryableConnect.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {retryableConnect.error}
            {retryableConnect.canRetry && (
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2"
                onClick={() => retryableConnect.reset()}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Tentar Novamente
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="space-y-3">
          <Progress value={getConnectionProgress()} className="w-full" />
          <p className="text-sm text-muted-foreground">
            {connectionStage || "Preparando conexão..."}
          </p>
          {retryableConnect.retryCount > 0 && (
            <p className="text-xs text-orange-600">
              Tentativa {retryableConnect.retryCount + 1}
            </p>
          )}
        </div>
      )}
      
      <Button 
        onClick={handleConnect}
        disabled={isLoading}
        className="bg-green-600 hover:bg-green-700 text-white w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {retryableConnect.retryCount > 0 ? 'Tentando novamente...' : 'Conectando...'}
          </>
        ) : connectionStage.includes("sucesso") ? (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            Conectado!
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
