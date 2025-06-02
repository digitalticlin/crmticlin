
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Loader2, AlertCircle, CheckCircle, RefreshCw, Plus } from "lucide-react";
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
    <Card className="transition-all duration-200 hover:shadow-md border-2 border-dashed border-green-300 bg-green-50/30 dark:bg-green-900/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-center">
          <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
            <Plus className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <CardTitle className="text-center text-lg font-semibold text-green-700">
          Nova Instância
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-center text-sm text-muted-foreground">
          Conecte uma nova instância WhatsApp Web.js
        </p>

        {retryableConnect.error && (
          <Alert variant="destructive" className="text-xs">
            <AlertCircle className="h-3 w-3" />
            <AlertDescription className="text-xs">
              {retryableConnect.error}
            </AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="space-y-3">
            <Progress value={getConnectionProgress()} className="w-full h-2" />
            <p className="text-xs text-center text-muted-foreground">
              {connectionStage || "Preparando conexão..."}
            </p>
            {retryableConnect.retryCount > 0 && (
              <p className="text-xs text-center text-orange-600">
                Tentativa {retryableConnect.retryCount + 1}
              </p>
            )}
          </div>
        )}
        
        <Button 
          onClick={handleConnect}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 text-white w-full"
          size="sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {retryableConnect.retryCount > 0 ? 'Tentando...' : 'Conectando...'}
            </>
          ) : connectionStage.includes("sucesso") ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Conectado!
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Conectar
            </>
          )}
        </Button>

        {retryableConnect.error && retryableConnect.canRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => retryableConnect.reset()}
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            Tentar Novamente
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
