
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wifi, QrCode, RefreshCcw, AlertCircle } from "lucide-react";

interface ConnectingInstanceCardProps {
  instanceId: string;
  status: 'connecting' | 'waiting_scan' | 'connected' | 'error';
  error?: string;
  onShowQR: () => void;
  onRefresh: () => void;
}

export function ConnectingInstanceCard({ 
  instanceId, 
  status, 
  error, 
  onShowQR, 
  onRefresh 
}: ConnectingInstanceCardProps) {
  const getStatusInfo = () => {
    switch (status) {
      case 'connecting':
        return {
          label: 'Conectando',
          color: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
          icon: <Wifi className="h-3 w-3 animate-pulse" />
        };
      case 'waiting_scan':
        return {
          label: 'Aguardando QR',
          color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
          icon: <QrCode className="h-3 w-3" />
        };
      case 'connected':
        return {
          label: 'Conectado',
          color: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
          icon: <Wifi className="h-3 w-3" />
        };
      case 'error':
        return {
          label: 'Erro',
          color: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
          icon: <AlertCircle className="h-3 w-3" />
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-green-600" />
            <CardTitle className="text-lg">WhatsApp</CardTitle>
          </div>
          <Badge variant="outline" className={statusInfo.color}>
            {statusInfo.icon}
            {statusInfo.label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          ID: {instanceId.substring(0, 8)}...
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {status === 'waiting_scan' && (
          <Button
            onClick={onShowQR}
            variant="outline"
            className="w-full"
          >
            <QrCode className="h-4 w-4 mr-2" />
            Ver QR Code
          </Button>
        )}

        {status === 'error' && (
          <>
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-red-700">
                {error || 'Erro desconhecido na conexão'}
              </p>
            </div>
            <Button
              onClick={onRefresh}
              variant="outline"
              className="w-full"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </>
        )}

        {status === 'connecting' && (
          <div className="p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-700">
              Preparando conexão WhatsApp...
            </p>
          </div>
        )}

        {status === 'connected' && (
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700">
              ✅ WhatsApp conectado com sucesso!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
