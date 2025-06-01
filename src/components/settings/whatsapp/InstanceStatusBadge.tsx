
import { Badge } from "@/components/ui/badge";

interface InstanceStatusBadgeProps {
  status: string;
}

export function InstanceStatusBadge({ status }: InstanceStatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
      case 'open':
        return 'bg-green-500';
      case 'connecting':
      case 'waiting_scan':
      case 'creating':
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
      case 'ready':
        return 'Conectado';
      case 'open':
        return 'Online';
      case 'connecting':
        return 'Conectando';
      case 'waiting_scan':
        return 'Aguardando QR';
      case 'creating':
        return 'Criando';
      case 'disconnected':
        return 'Desconectado';
      case 'error':
        return 'Erro';
      default:
        return status;
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={`${getStatusColor(status)} text-white`}
    >
      {getStatusText(status)}
    </Badge>
  );
}
