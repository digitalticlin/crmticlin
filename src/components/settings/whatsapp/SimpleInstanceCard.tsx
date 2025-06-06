
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
  onDelete?: (instanceId: string) => void;
  onRefreshQRCode?: (instanceId: string) => Promise<void>;
}

export const SimpleInstanceCard = ({ 
  instance, 
  onGenerateQR, 
  onDelete,
  onRefreshQRCode 
}: SimpleInstanceCardProps) => {
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
          textColor: 'text-green-600',
          badgeClass: 'bg-green-100/80 text-green-700 border-green-300/50'
        };
      case 'waiting_scan':
      case 'connecting':
        return {
          label: 'Aguardando',
          friendlyMessage: 'Aguardando leitura do QR Code',
          color: 'bg-yellow-500',
          icon: Clock,
          variant: 'secondary' as const,
          textColor: 'text-yellow-600',
          badgeClass: 'bg-yellow-100/80 text-yellow-700 border-yellow-300/50'
        };
      case 'created':
        return {
          label: 'Está quase pronto',
          friendlyMessage: 'Pronto para gerar QR Code e conectar',
          color: 'bg-blue-500',
          icon: QrCode,
          variant: 'outline' as const,
          textColor: 'text-blue-600',
          badgeClass: 'bg-blue-100/80 text-blue-700 border-blue-300/50'
        };
      default:
        return {
          label: 'Desconectado',
          friendlyMessage: 'Conexão perdida, reconecte seu WhatsApp',
          color: 'bg-red-500',
          icon: AlertCircle,
          variant: 'destructive' as const,
          textColor: 'text-red-600',
          badgeClass: 'bg-red-100/80 text-red-700 border-red-300/50'
        };
    }
  };

  const status = getSimpleStatus();
  const StatusIcon = status.icon;
  const isConnected = instance.connection_status === 'connected' || 
                     instance.connection_status === 'ready' || 
                     instance.connection_status === 'open';

  const handleDelete = () => {
    if (onDelete) {
      onDelete(instance.id);
    }
  };

  return (
    <Card className={`group relative transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 
      bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl overflow-hidden
      ${isConnected ? 'ring-2 ring-green-300/50 shadow-green-100/50' : 'shadow-lg'}`}>
      
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      
      <CardHeader className="pb-4 relative z-10">
        <CardTitle className="flex items-center justify-between text-lg font-semibold">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-green-400/20 to-green-600/20 backdrop-blur-sm">
              <Smartphone className="h-5 w-5 text-green-700" />
            </div>
            <div className="flex flex-col">
              <span className="truncate text-gray-800 font-medium">{instance.instance_name}</span>
              {instance.phone && (
                <span className="text-sm text-gray-600 font-normal">+{instance.phone}</span>
              )}
            </div>
          </div>
          <Badge className={`text-xs font-medium ${status.badgeClass} backdrop-blur-sm`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 relative z-10">
        {/* Profile Info for connected instances */}
        {isConnected && instance.profile_name && (
          <div className="p-3 rounded-lg bg-white/20 backdrop-blur-sm border border-white/20">
            <p className="text-sm font-medium text-gray-700">
              <span className="text-gray-500">Perfil:</span> {instance.profile_name}
            </p>
          </div>
        )}

        {/* Friendly Status Message */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
          <StatusIcon className={`h-5 w-5 ${status.textColor}`} />
          <span className="text-sm font-medium text-gray-700">{status.friendlyMessage}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {/* QR Code button for non-connected instances */}
          {!isConnected && (
            <Button
              onClick={onGenerateQR}
              size="sm"
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 
                text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <QrCode className="h-4 w-4 mr-2" />
              Gerar QR Code
            </Button>
          )}
          
          {/* Connected state button */}
          {isConnected && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 bg-white/20 backdrop-blur-sm border-white/30 text-green-700 
                hover:bg-white/30 font-medium"
              disabled
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Conectado
            </Button>
          )}

          {/* Delete button - Always available */}
          <Button
            onClick={handleDelete}
            variant="outline"
            size="sm"
            className="bg-white/20 backdrop-blur-sm border-white/30 text-red-600 
              hover:bg-red-50/50 hover:border-red-300/50 hover:text-red-700 
              transition-all duration-200"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Help Text */}
        {!isConnected && (
          <div className="text-center pt-2">
            <p className="text-xs text-gray-500 bg-white/10 backdrop-blur-sm rounded-full py-1 px-3 inline-block">
              {instance.connection_status === 'connecting' 
                ? 'Use os botões de sincronização global se o QR Code não funcionar'
                : 'Clique em "Gerar QR Code" e escaneie com seu WhatsApp'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
