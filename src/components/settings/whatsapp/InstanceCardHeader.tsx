
import { CardTitle } from "@/components/ui/card";
import { WhatsAppWebInstance } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { MessageCircle, Clock } from "lucide-react";

interface InstanceCardHeaderProps {
  instance: WhatsAppWebInstance;
}

export function InstanceCardHeader({ instance }: InstanceCardHeaderProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-green-600" />
        <CardTitle className="text-lg">{instance.instance_name}</CardTitle>
      </div>
      
      {instance.date_connected && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Conectado em {formatDate(instance.date_connected)}</span>
        </div>
      )}
    </div>
  );
}
