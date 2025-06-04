
import { WhatsAppWebInstanceCard } from "./WhatsAppWebInstanceCard";
import { WhatsAppWebInstance } from "@/hooks/whatsapp/useWhatsAppWebInstances";

interface WhatsAppWebInstancesGridProps {
  instances: WhatsAppWebInstance[];
  onRefreshQR: (instanceId: string) => void;
  onDelete: (instanceId: string) => void;
  onShowQR: (instance: WhatsAppWebInstance) => void;
}

export const WhatsAppWebInstancesGrid = ({
  instances,
  onRefreshQR,
  onDelete,
  onShowQR
}: WhatsAppWebInstancesGridProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {instances.map((instance) => (
        <WhatsAppWebInstanceCard
          key={instance.id}
          instance={instance}
          onRefreshQR={onRefreshQR}
          onDelete={onDelete}
          onShowQR={() => onShowQR(instance)}
        />
      ))}
    </div>
  );
};
