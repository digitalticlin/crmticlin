
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Smartphone, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  QrCode,
  Loader2
} from "lucide-react";
import { WhatsAppWebInstance } from "@/types/whatsapp";
import { DeleteInstanceButton } from "@/modules/whatsapp/instanceDeletion";
import { GenerateQRButton } from "@/modules/whatsapp/qrCodeManagement/components/GenerateQRButton";

interface SimpleInstanceCardProps {
  instance: WhatsAppWebInstance;
  onGenerateQR: (instanceId: string, instanceName: string) => void;
  onDelete: () => void;
}

export const SimpleInstanceCard = ({ 
  instance, 
  onGenerateQR, 
  onDelete
}: SimpleInstanceCardProps) => {

  const getStatusInfo = () => {
    const status = instance.connection_status?.toLowerCase() || 'unknown';
    
    switch (status) {
      case 'ready':
      case 'connected':
        return {
          color: 'bg-green-100/60 text-green-800 backdrop-blur-sm border-green-200/50',
          icon: CheckCircle,
          text: 'Conectado',
          description: 'WhatsApp conectado e funcionando'
        };
      case 'connecting':
      case 'initializing':
        return {
          color: 'bg-yellow-100/60 text-yellow-800 backdrop-blur-sm border-yellow-200/50',
          icon: Clock,
          text: 'Conectando',
          description: 'Estabelecendo conexão...'
        };
      case 'qr_generated':
      case 'waiting_scan':
      case 'qr_ready':
        return {
          color: 'bg-blue-100/60 text-blue-800 backdrop-blur-sm border-blue-200/50',
          icon: AlertTriangle,
          text: 'Aguardando QR',
          description: 'QR Code disponível para escaneamento'
        };
      default:
        return {
          color: 'bg-gray-100/60 text-gray-800 backdrop-blur-sm border-gray-200/50',
          icon: AlertTriangle,
          text: 'Desconectado',
          description: 'Precisa conectar'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  const isConnected = ['ready', 'connected'].includes(instance.connection_status?.toLowerCase() || '');
  
  const needsQrCode = !isConnected || 
    (instance.web_status === 'waiting_qr') || 
    ['waiting_scan', 'qr_ready', 'disconnected'].includes(
      instance.connection_status?.toLowerCase() || 'unknown'
    );

  return (
    <Card className="bg-white/20 backdrop-blur-xl border border-white/20 shadow-glass hover:shadow-glass-lg transition-all duration-300 rounded-2xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      
      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              {instance.instance_name}
            </h3>
            {instance.phone && (
              <p className="text-sm text-gray-600">
                📱 {instance.phone}
              </p>
            )}
          </div>
          
          <Badge className={`${statusInfo.color}`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo.text}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 relative z-10">
        <div className="text-sm text-gray-600">
          <p>{statusInfo.description}</p>
          {instance.date_connected && (
            <p className="text-xs mt-1">
              Conectado: {new Date(instance.date_connected).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {needsQrCode && (
            <GenerateQRButton
              instanceId={instance.id}
              instanceName={instance.instance_name}
              onSuccess={() => console.log('QR Code gerado com sucesso')}
              onModalOpen={onGenerateQR}
              variant="default"
              size="sm"
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
            />
          )}
          
          <DeleteInstanceButton
            instanceId={instance.id}
            instanceName={instance.instance_name}
            onSuccess={onDelete}
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50/60 backdrop-blur-sm border-white/20"
          />
        </div>
      </CardContent>
    </Card>
  );
};
