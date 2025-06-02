
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wifi } from "lucide-react";

interface ConnectWhatsAppButtonProps {
  onConnect: () => void;
  isConnecting: boolean;
}

export function ConnectWhatsAppButton({ onConnect, isConnecting }: ConnectWhatsAppButtonProps) {
  return (
    <Card className="glass-card border-dashed border-2 border-green-300/50 bg-green-50/30 dark:bg-green-900/20 backdrop-blur-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-green-100/50 dark:bg-green-800/30">
            <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-lg text-green-700 dark:text-green-300">Conectar WhatsApp</CardTitle>
        </div>
        <p className="text-sm text-green-600/80 dark:text-green-400/80">
          Conecte sua conta WhatsApp de forma rápida e segura
        </p>
      </CardHeader>

      <CardContent>
        <Button
          onClick={onConnect}
          disabled={isConnecting}
          className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg transition-all duration-200"
          size="lg"
        >
          <Wifi className="h-4 w-4 mr-2" />
          {isConnecting ? 'Conectando...' : 'Conectar WhatsApp'}
        </Button>

        <div className="mt-4 p-3 glass-card bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200/30">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>Conexão Automática:</strong> Clique para conectar. Um QR code será gerado 
            automaticamente para você escanear com seu WhatsApp.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
