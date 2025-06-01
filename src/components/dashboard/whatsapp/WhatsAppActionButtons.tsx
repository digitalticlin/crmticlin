
import { MessageSquare, QrCode, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppWebInstance } from "@/hooks/whatsapp/useWhatsAppWebInstances";

interface WhatsAppActionButtonsProps {
  isLoading: boolean;
  isCreating: boolean;
  instances: WhatsAppWebInstance[];
  connectedInstances: WhatsAppWebInstance[];
  disconnectedInstances: WhatsAppWebInstance[];
  onCreateInstance: () => void;
  onShowQR: (instanceId: string) => void;
}

export function WhatsAppActionButtons({
  isLoading,
  isCreating,
  instances,
  connectedInstances,
  disconnectedInstances,
  onCreateInstance,
  onShowQR
}: WhatsAppActionButtonsProps) {
  if (isLoading) {
    return (
      <Button disabled className="w-full">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Carregando...
      </Button>
    );
  }

  if (disconnectedInstances.length === 0) {
    return (
      <Button 
        onClick={onCreateInstance}
        className="w-full bg-green-600 hover:bg-green-700"
        disabled={isCreating}
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        {isCreating ? 'Criando...' : 'Criar Nova Instância WhatsApp'}
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Button 
        onClick={() => onShowQR(disconnectedInstances[0].id)}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        <QrCode className="h-4 w-4 mr-2" />
        Conectar WhatsApp ({disconnectedInstances[0].instance_name})
      </Button>

      {instances.length > 0 && (
        <Button variant="outline" className="w-full" asChild>
          <a href="/settings">Ver Todas as Instâncias</a>
        </Button>
      )}
    </div>
  );
}
