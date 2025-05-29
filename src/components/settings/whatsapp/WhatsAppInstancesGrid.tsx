
import WhatsAppInstanceStatusCard from "./WhatsAppInstanceStatusCard";
import { WhatsAppInstance } from "@/hooks/whatsapp/whatsappInstanceStore";

interface WhatsAppInstancesGridProps {
  instances: WhatsAppInstance[];
  instanceLoading: Record<string, boolean>;
  onConnect: (instanceId: string) => Promise<void>;
  onDelete: (instanceId: string) => Promise<void>;
  onRefreshQrCode: (instanceId: string) => Promise<void>;
}

export const WhatsAppInstancesGrid = ({
  instances,
  instanceLoading,
  onConnect,
  onDelete,
  onRefreshQrCode
}: WhatsAppInstancesGridProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {instances
        .filter(instance => !!instance.id && instance.id !== "1")
        .map(instance => (
          <WhatsAppInstanceStatusCard
            key={instance.id}
            instance={instance}
            isLoading={instanceLoading[instance.id] || false}
            onConnect={() => onConnect(instance.id)}
            onDelete={() => onDelete(instance.id)}
            onRefreshQrCode={() => onRefreshQrCode(instance.id)}
          />
        ))}
    </div>
  );
};
