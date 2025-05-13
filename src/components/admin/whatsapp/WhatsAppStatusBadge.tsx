
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, RefreshCcw } from "lucide-react";

interface WhatsAppInstanceStatusProps {
  status: string;
}

export const WhatsAppInstanceStatus = ({ status }: WhatsAppInstanceStatusProps) => {
  switch(status) {
    case 'connected':
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" /> Conectado
        </Badge>
      );
    case 'disconnected':
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
          <XCircle className="h-3 w-3 mr-1" /> Desconectado
        </Badge>
      );
    case 'error':
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <AlertTriangle className="h-3 w-3 mr-1" /> Erro
        </Badge>
      );
    case 'connecting':
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <RefreshCcw className="h-3 w-3 mr-1 animate-spin" /> Conectando
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};
