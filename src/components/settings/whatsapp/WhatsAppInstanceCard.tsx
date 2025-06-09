
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WhatsAppWebInstance } from "@/types/whatsapp";
import { 
  MessageSquare, 
  Phone, 
  User, 
  QrCode, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  Clock
} from "lucide-react";

interface WhatsAppInstanceCardProps {
  instance: WhatsAppWebInstance;
  onDelete: () => Promise<void>;
  onRefreshQR: () => Promise<void>;
}

export const WhatsAppInstanceCard = ({ 
  instance, 
  onDelete, 
  onRefreshQR 
}: WhatsAppInstanceCardProps) => {
  const getStatusInfo = () => {
    const status = instance.connection_status;
    
    switch (status) {
      case 'connected':
        return {
          icon: CheckCircle,
          color: 'bg-green-100 text-green-800 border-green-200',
          text: 'Conectado'
        };
      case 'disconnected':
        return {
          icon: AlertCircle,
          color: 'bg-red-100 text-red-800 border-red-200',
          text: 'Desconectado'
        };
      default:
        return {
          icon: Clock,
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          text: 'Aguardando'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  const isConnected = instance.connection_status === 'connected';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            <span className="font-medium">{instance.instance_name}</span>
          </div>
          <Badge className={statusInfo.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo.text}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Dados da Conexão */}
        <div className="space-y-2">
          {instance.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-gray-500" />
              <span>{instance.phone}</span>
            </div>
          )}
          
          {instance.profile_name && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-gray-500" />
              <span>{instance.profile_name}</span>
            </div>
          )}
          
          {!isConnected && (
            <div className="text-xs text-gray-500">
              Escaneie o QR Code para conectar
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          {!isConnected && (
            <Button 
              onClick={onRefreshQR}
              variant="outline" 
              size="sm"
              className="flex-1"
            >
              <QrCode className="h-4 w-4 mr-1" />
              Ver QR
            </Button>
          )}
          
          <Button 
            onClick={onDelete}
            variant="outline" 
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
