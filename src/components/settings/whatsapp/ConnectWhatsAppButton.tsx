
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wifi, Plus, Loader2 } from "lucide-react";

interface ConnectWhatsAppButtonProps {
  onConnect: () => void;
  isConnecting: boolean;
}

export function ConnectWhatsAppButton({ onConnect, isConnecting }: ConnectWhatsAppButtonProps) {
  return (
    <Card className="glass-card border-0 border-dashed border-2 border-green-200 dark:border-green-700/30 hover:border-green-300 dark:hover:border-green-600/50 transition-colors group">
      <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="p-3 rounded-full bg-green-100/50 dark:bg-green-800/30 group-hover:bg-green-200/50 dark:group-hover:bg-green-700/50 transition-colors">
          {isConnecting ? (
            <Loader2 className="h-8 w-8 text-green-600 dark:text-green-400 animate-spin" />
          ) : (
            <Plus className="h-8 w-8 text-green-600 dark:text-green-400" />
          )}
        </div>
        
        <div>
          <h3 className="font-medium text-green-800 dark:text-green-300">
            {isConnecting ? 'Criando Instância...' : 'Conectar WhatsApp'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {isConnecting 
              ? 'Aguarde enquanto criamos sua nova instância' 
              : 'Criar uma nova conexão WhatsApp Web.js'
            }
          </p>
        </div>

        <Button
          onClick={onConnect}
          disabled={isConnecting}
          className="bg-green-600 hover:bg-green-700 text-white w-full"
        >
          <Wifi className="h-4 w-4 mr-2" />
          {isConnecting ? 'Conectando...' : 'Conectar Agora'}
        </Button>
      </CardContent>
    </Card>
  );
}
