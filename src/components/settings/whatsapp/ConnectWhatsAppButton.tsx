
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wifi } from "lucide-react";

interface ConnectWhatsAppButtonProps {
  onConnect: () => void;
  isConnecting: boolean;
}

export function ConnectWhatsAppButton({ onConnect, isConnecting }: ConnectWhatsAppButtonProps) {
  return (
    <Card className="border-dashed border-2 border-green-300 bg-green-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Wifi className="h-4 w-4 text-green-600" />
          <CardTitle className="text-lg text-green-700">Conectar WhatsApp</CardTitle>
        </div>
        <p className="text-sm text-green-600">
          Conecte sua conta WhatsApp de forma rápida e segura
        </p>
      </CardHeader>

      <CardContent>
        <Button
          onClick={onConnect}
          disabled={isConnecting}
          className="w-full bg-green-600 hover:bg-green-700"
          size="lg"
        >
          <Wifi className="h-4 w-4 mr-2" />
          {isConnecting ? 'Conectando...' : 'Conectar WhatsApp'}
        </Button>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>Conexão Automática:</strong> Clique para conectar. Um QR code será gerado 
            automaticamente para você escanear com seu WhatsApp.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
