
import { Button } from "@/components/ui/button";
import { Plus, Settings, RefreshCw } from "lucide-react";
import { useSalesFunnelContext } from "../SalesFunnelProvider";

interface FunnelActionButtonsProps {
  onOpenConfig?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isAdmin?: boolean;
}

export const FunnelActionButtons = ({ 
  onOpenConfig, 
  onRefresh, 
  isRefreshing = false,
  isAdmin: propIsAdmin
}: FunnelActionButtonsProps) => {
  const { 
    addColumn,
    isAdmin: contextIsAdmin,
    refetchLeads,
    refetchStages 
  } = useSalesFunnelContext();

  // Use prop isAdmin if provided, otherwise use context isAdmin
  const isAdmin = propIsAdmin !== undefined ? propIsAdmin : contextIsAdmin;

  const handleAddColumn = async () => {
    const title = prompt("Nome da nova etapa:");
    if (title) {
      await addColumn(title);
      await refetchStages();
    }
  };

  const handleRefreshData = async () => {
    await Promise.all([refetchLeads(), refetchStages()]);
    onRefresh?.();
  };

  const handleOpenConfig = () => {
    onOpenConfig?.();
  };

  return (
    <div className="flex items-center gap-2">
      {isAdmin && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddColumn}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Etapa
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenConfig}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Configurar
          </Button>
        </>
      )}
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefreshData}
        disabled={isRefreshing}
        className="flex items-center gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        Atualizar
      </Button>
    </div>
  );
};
