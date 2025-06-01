
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { WhatsAppWebInstance } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { Phone, User, Loader2, Wifi } from "lucide-react";
import { ConnectionHealthIndicator } from "./ConnectionHealthIndicator";

interface InstanceCardContentProps {
  instance: WhatsAppWebInstance;
  isConnected: boolean;
  needsQRCode: boolean;
}

export function InstanceCardContent({
  instance,
  isConnected,
  needsQRCode
}: InstanceCardContentProps) {
  const getStatusBadge = () => {
    const status = instance.web_status || instance.connection_status;
    
    switch (status) {
      case 'ready':
      case 'open':
        return <Badge className="bg-green-500 text-white">Conectado</Badge>;
      case 'waiting_scan':
        return <Badge className="bg-blue-500 text-white">Aguardando QR</Badge>;
      case 'connecting':
      case 'creating':
        return (
          <Badge className="bg-yellow-500 text-white flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Conectando...
          </Badge>
        );
      case 'disconnected':
        return <Badge className="bg-red-500 text-white">Desconectado</Badge>;
      case 'error':
        return <Badge className="bg-red-600 text-white">Erro</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Verificando...'}</Badge>;
    }
  };

  const isConnecting = ['connecting', 'creating', 'waiting_scan'].includes(instance.web_status || instance.connection_status);

  return (
    <div className="space-y-3">
      {/* Status principal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wifi className="h-4 w-4 text-muted-foreground" />
          {getStatusBadge()}
        </div>
        
        {/* Indicador de saúde da conexão apenas para conectados */}
        {isConnected && instance.vps_instance_id && (
          <ConnectionHealthIndicator 
            instanceId={instance.id}
            vpsInstanceId={instance.vps_instance_id}
          />
        )}
      </div>

      {/* Mensagem de status durante conexão */}
      {isConnecting && (
        <div className="text-center py-2">
          <div className="text-sm text-muted-foreground">
            {instance.web_status === 'waiting_scan' 
              ? 'Escaneie o QR Code para conectar'
              : 'Estabelecendo conexão...'
            }
          </div>
        </div>
      )}

      <Separator />

      {/* Informações da instância - mostrar sempre que disponível */}
      <div className="space-y-2 text-sm">
        {instance.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <span className="font-mono">{instance.phone}</span>
          </div>
        )}
        
        {instance.profile_name && (
          <div className="flex items-center gap-2">
            <User className="h-3 w-3 text-muted-foreground" />
            <span>{instance.profile_name}</span>
          </div>
        )}
      </div>

      {/* Informações técnicas apenas em desenvolvimento */}
      {process.env.NODE_ENV === 'development' && instance.vps_instance_id && (
        <div className="text-xs text-muted-foreground font-mono bg-gray-50 p-2 rounded border">
          VPS ID: {instance.vps_instance_id.substring(0, 20)}...
        </div>
      )}
    </div>
  );
}
