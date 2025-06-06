
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  QrCode, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Smartphone
} from "lucide-react";
import { WhatsAppWebInstance } from "@/hooks/whatsapp/useWhatsAppWebInstances";

interface SimpleInstanceCardProps {
  instance: WhatsAppWebInstance;
  onGenerateQR: () => void;
}

export const SimpleInstanceCard = ({ instance, onGenerateQR }: SimpleInstanceCardProps) => {
  const getSimpleStatus = () => {
    switch (instance.connection_status) {
      case 'connected':
      case 'ready':
      case 'open':
        return {
          label: 'Conectado',
          color: 'bg-green-500',
          icon: CheckCircle,
          variant: 'default' as const
        };
      case 'waiting_scan':
      case 'connecting':
        return {
          label: 'Aguardando',
          color: 'bg-yellow-500',
          icon: Clock,
          variant: 'secondary' as const
        };
      case 'created':
        return {
          label: 'Pronto para conectar',
          color: 'bg-blue-500',
          icon: QrCode,
          variant: 'outline' as const
        };
      default:
        return {
          label: 'Desconectado',
          color: 'bg-red-500',
          icon: AlertCircle,
          variant: 'destructive' as const
        };
    }
  };

  const status = getSimpleStatus();
  const StatusIcon = status.icon;
  const isConnected = instance.connection_status === 'connected' || 
                     instance.connection_status === 'ready' || 
                     instance.connection_status === 'open';

  const canGenerateQR = !isConnected && 
                       (instance.connection_status === 'created' || 
                        instance.connection_status === 'waiting_scan');

  return (
    <Card className={`transition-all hover:shadow-md ${
      isConnected ? 'border-green-200 bg-green-50/50' : ''
    }`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-gray-600" />
            <span className="truncate">WhatsApp</span>
          </div>
          <Badge variant={status.variant} className="text-xs">
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Connection Info */}
        {isConnected && instance.phone && (
          <div className="text-sm text-gray-600">
            <p><strong>Telefone:</strong> +{instance.phone}</p>
            {instance.profile_name && (
              <p><strong>Nome:</strong> {instance.profile_name}</p>
            )}
          </div>
        )}

        {/* Status Messages */}
        <div className="text-sm text-gray-500">
          {isConnected && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>WhatsApp conectado e funcionando</span>
            </div>
          )}
          
          {instance.connection_status === 'waiting_scan' && (
            <div className="flex items-center gap-2 text-yellow-600">
              <Clock className="h-4 w-4" />
              <span>Aguardando leitura do QR Code</span>
            </div>
          )}
          
          {instance.connection_status === 'created' && (
            <div className="flex items-center gap-2 text-blue-600">
              <QrCode className="h-4 w-4" />
              <span>Pronto para gerar QR Code</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {canGenerateQR && (
            <Button
              onClick={onGenerateQR}
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <QrCode className="h-4 w-4 mr-2" />
              Gerar QR Code
            </Button>
          )}
          
          {isConnected && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Conectado
            </Button>
          )}
        </div>
        
        {/* Help Text */}
        {canGenerateQR && (
          <p className="text-xs text-gray-500 text-center">
            Clique em "Gerar QR Code" e escaneie com seu WhatsApp
          </p>
        )}
      </CardContent>
    </Card>
  );
};
