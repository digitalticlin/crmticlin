
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, QrCode, RefreshCw, Wifi } from "lucide-react";
import { WhatsAppWebInstance } from "@/hooks/whatsapp/useWhatsAppWebInstances";

interface WhatsAppWebInstanceCardProps {
  instance: WhatsAppWebInstance;
  onDelete: (instanceId: string) => void;
  onRefreshQR: (instanceId: string) => void;
  onShowQR: () => void;
  isNewInstance?: boolean;
}

export function WhatsAppWebInstanceCard({
  instance,
  onDelete,
  onRefreshQR,
  onShowQR,
  isNewInstance = false
}: WhatsAppWebInstanceCardProps) {
  const getStatusBadge = () => {
    switch (instance.connection_status) {
      case 'connected':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
            Conectado
          </Badge>
        );
      case 'connecting':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1 animate-pulse" />
            Conectando
          </Badge>
        );
      case 'disconnected':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-1" />
            Desconectado
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <div className="w-2 h-2 bg-gray-500 rounded-full mr-1" />
            Aguardando
          </Badge>
        );
    }
  };

  const canShowQR = instance.web_status === 'waiting_scan' && instance.qr_code;
  const isConnected = instance.connection_status === 'connected';

  return (
    <Card className={`${isNewInstance ? 'border-blue-300 bg-blue-50/50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-lg">{instance.instance_name}</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        
        {instance.phone && (
          <p className="text-sm text-muted-foreground">
            📱 {instance.phone}
          </p>
        )}
        
        {instance.profile_name && (
          <p className="text-sm text-green-600">
            👤 {instance.profile_name}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="text-xs text-muted-foreground">
          <p>VPS ID: {instance.vps_instance_id}</p>
          <p>Status: {instance.web_status || 'Criando...'}</p>
        </div>

        <div className="flex gap-2">
          {canShowQR && (
            <Button
              variant="outline"
              size="sm"
              onClick={onShowQR}
              className="flex-1"
            >
              <QrCode className="h-4 w-4 mr-1" />
              Ver QR Code
            </Button>
          )}
          
          {!isConnected && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRefreshQR(instance.id)}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Atualizar
            </Button>
          )}
          
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(instance.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {isNewInstance && (
          <div className="mt-3 p-2 bg-blue-100 rounded-lg">
            <p className="text-xs text-blue-700">
              ✨ Nova instância criada! {canShowQR ? 'Escaneie o QR Code para conectar.' : 'Aguardando QR Code...'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
