
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  QrCode, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Smartphone,
  Trash2
} from "lucide-react";
import { WhatsAppWebInstance } from "@/hooks/whatsapp/useWhatsAppWebInstances";

interface SimpleInstanceCardProps {
  instance: WhatsAppWebInstance;
  onGenerateQR: () => void;
  onDelete?: () => void;
}

export const SimpleInstanceCard = ({ instance, onGenerateQR, onDelete }: SimpleInstanceCardProps) => {
  const getSimpleStatus = () => {
    switch (instance.connection_status) {
      case 'connected':
      case 'ready':
      case 'open':
        return {
          label: 'Conectado',
          friendlyMessage: 'WhatsApp conectado e funcionando!',
          color: 'bg-green-500',
          icon: CheckCircle,
          variant: 'default' as const,
          textColor: 'text-green-600'
        };
      case 'waiting_scan':
      case 'connecting':
        return {
          label: 'Aguardando',
          friendlyMessage: 'Aguardando leitura do QR Code',
          color: 'bg-yellow-500',
          icon: Clock,
          variant: 'secondary' as const,
          textColor: 'text-yellow-600'
        };
      case 'created':
        return {
          label: 'Está quase pronto',
          friendlyMessage: 'Pronto para gerar QR Code e conectar',
          color: 'bg-blue-500',
          icon: QrCode,
          variant: 'outline' as const,
          textColor: 'text-blue-600'
        };
      default:
        return {
          label: 'Desconectado',
          friendlyMessage: 'Conexão perdida, reconecte seu WhatsApp',
          color: 'bg-red-500',
          icon: AlertCircle,
          variant: 'destructive' as const,
          textColor: 'text-red-600'
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
            <span className="truncate">{instance.instance_name}</span>
          </div>
          <Badge variant={status.variant} className="text-xs">
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Connection Info for connected instances */}
        {isConnected && instance.phone && (
          <div className="text-sm text-gray-600">
            <p><strong>Telefone:</strong> +{instance.phone}</p>
            {instance.profile_name && (
              <p><strong>Nome:</strong> {instance.profile_name}</p>
            )}
          </div>
        )}

        {/* Friendly Status Message */}
        <div className="text-sm">
          <div className={`flex items-center gap-2 ${status.textColor}`}>
            <StatusIcon className="h-4 w-4" />
            <span>{status.friendlyMessage}</span>
          </div>
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

          {!isConnected && onDelete && (
            <Button
              onClick={onDelete}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
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
