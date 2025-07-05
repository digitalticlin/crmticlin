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
    <Card className="group relative transition-all duration-300 hover:shadow-glass-lg hover:-translate-y-1
      bg-white/20 backdrop-blur-xl border border-white/20 shadow-glass rounded-2xl overflow-hidden
      min-h-[220px] flex flex-col">
      
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      
      {/* Header: Nome completo em linha própria - padding reduzido */}
      <CardHeader className="pb-2 relative z-10 flex-shrink-0">
        <div className="space-y-2">
          {/* Nome da instância - linha completa */}
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 w-full">
            <Smartphone className="h-4 w-4 flex-shrink-0" />
            <span className="text-base">{instance.instance_name}</span>
          </h3>
          
          {/* Badge de status - posicionado abaixo */}
          <div className="flex justify-start">
            <Badge className={`${statusInfo.color}`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusInfo.text}
            </Badge>
          </div>
        </div>
      </CardHeader>

      {/* Corpo Central: Informações principais - espaçamento reduzido */}
      <CardContent className="flex-1 flex flex-col justify-center items-center text-center space-y-3 relative z-10 px-6">
        <div className="space-y-2">
          {/* Telefone se disponível */}
          {instance.phone && (
            <div className="flex items-center justify-center gap-2 text-gray-700">
              <span className="text-lg font-medium">📱 {instance.phone}</span>
            </div>
          )}
          
          {/* Descrição do status */}
          <p className="text-sm text-gray-600 leading-relaxed">
            {statusInfo.description}
          </p>
          
          {/* Data de conexão */}
          {instance.date_connected && isConnected && (
            <p className="text-xs text-gray-500">
              Conectado em {new Date(instance.date_connected).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
      </CardContent>

      {/* Footer: Botões de ação - padding e gap reduzidos */}
      <div className="p-3 border-t border-white/10 relative z-10 flex-shrink-0">
        <div className="flex gap-1.5 justify-center">
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
      </div>
    </Card>
  );
};
