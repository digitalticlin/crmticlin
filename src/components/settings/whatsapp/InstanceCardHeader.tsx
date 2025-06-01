
import { CardTitle } from "@/components/ui/card";
import { Wifi, Phone, AlertTriangle } from "lucide-react";
import { WhatsAppWebInstance } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { InstanceStatusBadge } from "./InstanceStatusBadge";

interface InstanceCardHeaderProps {
  instance: WhatsAppWebInstance;
  hasDiscrepancy: boolean;
}

export function InstanceCardHeader({ instance, hasDiscrepancy }: InstanceCardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Wifi className="h-4 w-4 text-green-600" />
        <CardTitle className="text-lg">WhatsApp Web</CardTitle>
        {hasDiscrepancy && (
          <AlertTriangle className="h-4 w-4 text-orange-500" />
        )}
      </div>
      <InstanceStatusBadge status={instance.web_status || instance.connection_status} />
    </div>
  );
}
