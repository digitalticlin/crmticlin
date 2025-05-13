
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WhatsAppHeaderProps {
  onRefresh?: () => void;
}

export const WhatsAppHeader = ({ onRefresh }: WhatsAppHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold">Instâncias WhatsApp</h2>
        <p className="text-sm text-muted-foreground">
          Monitore todas as conexões WhatsApp integradas via Evolution API
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="gap-1" onClick={onRefresh}>
          <RefreshCcw className="h-4 w-4" /> Atualizar Status
        </Button>
      </div>
    </div>
  );
};
