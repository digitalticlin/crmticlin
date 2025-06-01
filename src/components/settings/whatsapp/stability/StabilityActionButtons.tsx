
import { Button } from "@/components/ui/button";
import { RefreshCw, Shield, Search, Activity } from "lucide-react";

interface StabilityActionButtonsProps {
  isScanning: boolean;
  isRecovering: boolean;
  onStartStability: () => void;
  onVPSHealthCheck: () => void;
  onScanOrphans: () => void;
  onForceRecovery: () => void;
}

export function StabilityActionButtons({
  isScanning,
  isRecovering,
  onStartStability,
  onVPSHealthCheck,
  onScanOrphans,
  onForceRecovery
}: StabilityActionButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button 
        onClick={onStartStability}
        className="gap-2"
        variant="default"
      >
        <Shield className="h-4 w-4" />
        Iniciar Sistema Estabilidade
      </Button>

      <Button 
        onClick={onVPSHealthCheck}
        variant="outline"
        className="gap-2"
      >
        <Activity className="h-4 w-4" />
        Verificar VPS
      </Button>

      <Button 
        onClick={onScanOrphans}
        disabled={isScanning}
        variant="outline"
        className="gap-2"
      >
        {isScanning ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <Search className="h-4 w-4" />
        )}
        {isScanning ? 'Buscando...' : 'Buscar Órfãs'}
      </Button>

      <Button 
        onClick={onForceRecovery}
        disabled={isRecovering}
        variant="outline"
        className="gap-2"
      >
        {isRecovering ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        {isRecovering ? 'Recuperando...' : 'Recuperação Forçada'}
      </Button>
    </div>
  );
}
