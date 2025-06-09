
import { WhatsAppWebInstance } from "@/types/whatsapp";
import { WhatsAppInstanceCard } from "./WhatsAppInstanceCard";

interface WhatsAppInstanceGridProps {
  instances: WhatsAppWebInstance[];
  onDelete: (instanceId: string) => Promise<void>;
  onRefreshQR: (instanceId: string) => Promise<void>;
}

export const WhatsAppInstanceGrid = ({ 
  instances, 
  onDelete, 
  onRefreshQR 
}: WhatsAppInstanceGridProps) => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {instances.map((instance) => (
        <WhatsAppInstanceCard
          key={instance.id}
          instance={instance}
          onDelete={() => onDelete(instance.id)}
          onRefreshQR={() => onRefreshQR(instance.id)}
        />
      ))}
    </div>
  );
};
