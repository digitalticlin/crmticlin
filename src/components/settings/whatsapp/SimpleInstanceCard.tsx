
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
import { useQRCodeModal } from "@/modules/whatsapp/instanceCreation/hooks/useQRCodeModal";

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
  const { openModal } = useQRCodeModal();

  const getStatusInfo = () => {
    const status = instance.connection_status?.toLowerCase() || 'unknown';
    
    switch (status) {
      case 'ready':
      case 'connected':
        return {
          color: 'bg-green-100 text-green-800',
          icon: CheckCircle,
          text: 'Conectado',
          description: 'WhatsApp conectado e funcionando'
        };
      case 'connecting':
      case 'initializing':
        return {
          color: 'bg-yellow-100 text-yellow-800',
          icon: Clock,
          text: 'Conectando',
          description: 'Estabelecendo conexão...'
        };
      case 'qr_generated':
      case 'waiting_scan':
      case 'qr_ready':
        return {
          color: 'bg-blue-100 text-blue-800',
          icon: AlertTriangle,
          text: 'Aguardando QR',
          description: 'QR Code disponível para escaneamento'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
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

  const handleGenerateQR = () => {
    console.log('[SimpleInstanceCard] 🚀 NÍVEL 8: Abrindo QR code para instância:', instance.id);
    console.log('[SimpleInstanceCard] 📊 NÍVEL 8: Status atual:', instance.connection_status);
    
    // CORREÇÃO NÍVEL 8: Abrir modal diretamente sem delays
    openModal(instance.id);
    
    // Callback opcional para compatibilidade
    onGenerateQR?.(instance.id, instance.instance_name);
  };

  return (
    <Card className="bg-white border-l-4 border-l-green-500">
      <CardHeader className="pb-3">
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
          
          <Badge className={statusInfo.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo.text}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
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
            <Button
              onClick={handleGenerateQR}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <QrCode className="h-4 w-4 mr-1" />
              {instance.web_status === 'waiting_qr' ? 'Ver QR Code' : 'Gerar QR Code'}
            </Button>
          )}
          
          <DeleteInstanceButton
            instanceId={instance.id}
            instanceName={instance.instance_name}
            onSuccess={onDelete}
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          />
        </div>
      </CardContent>
    </Card>
  );
};
