
import { Phone } from "lucide-react";
import { WhatsAppWebInstance } from "@/hooks/whatsapp/useWhatsAppWebInstances";

interface InstanceCardContentProps {
  instance: WhatsAppWebInstance;
  isConnected: boolean;
  needsQRCode: boolean;
  hasDiscrepancy: boolean;
}

export function InstanceCardContent({ 
  instance, 
  isConnected, 
  needsQRCode, 
  hasDiscrepancy 
}: InstanceCardContentProps) {
  return (
    <>
      <p className="text-sm text-muted-foreground">
        Instância: {instance.instance_name}
      </p>
      {instance.phone && (
        <div className="flex items-center gap-1 text-green-600">
          <Phone className="h-3 w-3" />
          <span className="text-xs font-medium">{instance.phone}</span>
        </div>
      )}
      {instance.profile_name && (
        <p className="text-xs text-muted-foreground">
          Perfil: {instance.profile_name}
        </p>
      )}
      {!isConnected && !instance.phone && (
        <p className="text-xs text-amber-600 font-medium">
          {needsQRCode ? 'Aguardando conexão...' : 'Desconectado'}
        </p>
      )}
      {hasDiscrepancy && (
        <p className="text-xs text-orange-600 font-medium">
          Status pode estar desatualizado - tente forçar sincronização
        </p>
      )}
    </>
  );
}
