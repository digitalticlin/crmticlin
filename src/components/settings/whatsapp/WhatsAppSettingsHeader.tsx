
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface WhatsAppSettingsHeaderProps {
  isSuperAdmin: boolean;
  isSyncingAll: boolean;
  onSyncAll: () => void;
}

export const WhatsAppSettingsHeader = ({ 
  isSuperAdmin, 
  isSyncingAll, 
  onSyncAll 
}: WhatsAppSettingsHeaderProps) => {
  return (
    <div className="flex flex-col space-y-1.5">
      <div className="flex items-center gap-2">
        <h3 className="text-xl font-semibold">WhatsApp Management</h3>
        {/* Botão de sincronizar status de toda a empresa (apenas Admin comum, não SuperAdmin global) */}
        {!isSuperAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSyncAll}
            disabled={isSyncingAll}
            className="ml-2"
          >
            {isSyncingAll ? (
              <>
                <Loader2 className="animate-spin mr-1 h-4 w-4" />
                Atualizando...
              </>
            ) : (
              <>
                <Loader2 className="mr-1 h-4 w-4" />
                Atualizar Status
              </>
            )}
          </Button>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Connect and manage your WhatsApp instances
      </p>
    </div>
  );
};
