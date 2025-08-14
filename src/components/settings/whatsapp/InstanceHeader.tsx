
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { WhatsAppInstance } from "@/hooks/whatsapp/whatsappInstanceStore";

interface InstanceHeaderProps {
  instance: WhatsAppInstance;
}

export const InstanceHeader = ({ instance }: InstanceHeaderProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'ready':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'disconnected':
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
      case 'ready':
        return 'Conectado';
      case 'connecting':
        return 'Conectando';
      case 'disconnected':
        return 'Desconectado';
      case 'error':
        return 'Erro';
      default:
        return 'Desconhecido';
    }
  };

  const isConnected = instance.status === 'connected' || instance.status === 'ready';
  const phone = instance.phoneNumber || 'Não configurado';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={instance.profilePicture} alt={instance.name} />
              <AvatarFallback>
                {instance.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{instance.name}</h3>
              <p className="text-sm text-gray-600">{phone}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge 
              variant={isConnected ? "default" : "secondary"}
              className={`${getStatusColor(instance.status)} text-white`}
            >
              {getStatusText(instance.status)}
            </Badge>
            
            {isConnected && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600">Online</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-600">Status</p>
            <p>{getStatusText(instance.status)}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600">Tipo</p>
            <p className="capitalize">{instance.connectionType}</p>
          </div>
          <div>
            <p className="font-medium text-gray-600">Criado</p>
            <p>{new Date(instance.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
