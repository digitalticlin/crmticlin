
import { CheckCircle, Loader2 } from "lucide-react";

interface WhatsAppConnectionStatusProps {
  isLoading: boolean;
  connectedCount: number;
  disconnectedCount: number;
}

export function WhatsAppConnectionStatus({ 
  isLoading, 
  connectedCount, 
  disconnectedCount 
}: WhatsAppConnectionStatusProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div>
        <p className="text-sm font-medium">Status da Conexão</p>
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {connectedCount} conectada(s), {disconnectedCount} desconectada(s)
          </p>
        )}
      </div>
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      ) : connectedCount > 0 ? (
        <CheckCircle className="h-5 w-5 text-green-600" />
      ) : (
        <div className="h-2 w-2 bg-gray-400 rounded-full" />
      )}
    </div>
  );
}
