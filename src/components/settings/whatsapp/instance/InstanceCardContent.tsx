
import { Badge } from "@/components/ui/badge";
import { Phone } from "lucide-react";
import { WhatsAppWebInstance } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { getStatusInfo } from "./InstanceStatusInfo";

interface InstanceCardContentProps {
  instance: WhatsAppWebInstance;
}

export const InstanceCardContent = ({ instance }: InstanceCardContentProps) => {
  const statusInfo = getStatusInfo(instance);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="flex-1 space-y-6">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl 
          bg-white/30 backdrop-blur-sm border border-white/40 shadow-lg mb-2">
          <StatusIcon className="h-8 w-8 text-gray-700" />
        </div>
        
        <h3 className="font-bold text-xl text-gray-800 mb-2">{instance.instance_name}</h3>
        
        <Badge className={`${statusInfo.color} border backdrop-blur-sm px-4 py-2 text-sm font-medium`}>
          {statusInfo.label}
        </Badge>
        
        <p className="text-sm text-gray-600 leading-relaxed">
          {statusInfo.description}
        </p>
      </div>

      {/* Informações do Telefone */}
      {instance.phone && (
        <div className="flex items-center justify-center gap-2 p-3 rounded-xl 
          bg-white/20 backdrop-blur-sm border border-white/30">
          <Phone className="h-4 w-4 text-gray-600" />
          <span className="text-sm text-gray-700 font-medium">{instance.phone}</span>
        </div>
      )}

      {/* Informação da VPS */}
      {instance.vps_instance_id && (
        <div className="text-center">
          <p className="text-xs text-gray-500">
            VPS: {instance.vps_instance_id.substring(0, 8)}...
          </p>
        </div>
      )}

      {/* Dica para usuário */}
      {statusInfo.canRetry && (
        <div className="p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-2xl 
          border border-blue-200/50 backdrop-blur-sm">
          <p className="text-sm text-blue-700 text-center leading-relaxed">
            💡 <strong>Dica:</strong> Clique em "Gerar QR Code" para conectar seu WhatsApp
          </p>
        </div>
      )}
    </div>
  );
};
