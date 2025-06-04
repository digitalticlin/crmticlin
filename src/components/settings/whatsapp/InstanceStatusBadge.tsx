
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

interface InstanceStatusBadgeProps {
  connectionStatus: string;
}

export function InstanceStatusBadge({ connectionStatus }: InstanceStatusBadgeProps) {
  const isConnected = connectionStatus === 'connected' || 
                     connectionStatus === 'ready' || 
                     connectionStatus === 'open';
  
  const isConnecting = connectionStatus === 'connecting';
  const isDisconnected = connectionStatus === 'disconnected';

  if (isConnected) {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-300 font-medium">
        <CheckCircle className="w-3 h-3 mr-1" />
        Conectado
      </Badge>
    );
  }
  
  if (isConnecting) {
    return (
      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 font-medium">
        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1 animate-pulse" />
        Conectando
      </Badge>
    );
  }
  
  if (isDisconnected) {
    return (
      <Badge className="bg-red-100 text-red-800 border-red-300 font-medium">
        <div className="w-2 h-2 bg-red-500 rounded-full mr-1" />
        Desconectado
      </Badge>
    );
  }
  
  return (
    <Badge className="bg-gray-100 text-gray-800 border-gray-300 font-medium">
      <div className="w-2 h-2 bg-gray-500 rounded-full mr-1 animate-pulse" />
      Preparando
    </Badge>
  );
}
