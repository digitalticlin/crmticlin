
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from "@/components/ui/modern-card";
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
    <ModernCard>
      <ModernCardHeader>
        <ModernCardTitle className="flex items-center gap-2">
          <span>Suas Instâncias WhatsApp</span>
          <span className="text-sm font-normal text-muted-foreground/80">
            ({instances.length})
          </span>
        </ModernCardTitle>
      </ModernCardHeader>
      <ModernCardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {instances.map((instance) => (
            <WhatsAppWebInstanceCard
              key={instance.id}
              instance={instance}
              onDelete={onDelete}
              onRefreshQR={onRefreshQR}
              onShowQR={() => onShowQR(instance)}
            />
          ))}
        </div>
      </ModernCardContent>
    </ModernCard>
  );
};
