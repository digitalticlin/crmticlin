
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Wifi, WifiOff } from "lucide-react";

interface VPSStatusCardProps {
  vpsHealth?: {
    isOnline: boolean;
    responseTime: number;
    lastChecked: string;
    consecutiveFailures: number;
    error?: string;
  };
  systemStatus?: {
    recoveryActive: boolean;
    stabilityActive: boolean;
  };
}

export function VPSStatusCard({ vpsHealth, systemStatus }: VPSStatusCardProps) {
  const getVPSStatusBadge = () => {
    if (!vpsHealth) return null;
    
    const { isOnline, responseTime, consecutiveFailures } = vpsHealth;
    
    if (isOnline) {
      return (
        <Badge variant="default" className="gap-1">
          <Wifi className="h-3 w-3" />
          Online ({responseTime}ms)
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="gap-1">
          <WifiOff className="h-3 w-3" />
          Offline ({consecutiveFailures} falhas)
        </Badge>
      );
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Status do Sistema
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status do VPS */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">VPS</h4>
          <div className="flex flex-wrap gap-2">
            {getVPSStatusBadge()}
            {vpsHealth?.lastChecked && (
              <Badge variant="outline" className="text-xs">
                Última verificação: {new Date(vpsHealth.lastChecked).toLocaleTimeString()}
              </Badge>
            )}
          </div>
          {vpsHealth?.error && (
            <div className="text-xs text-red-600 mt-1">
              Erro: {vpsHealth.error}
            </div>
          )}
        </div>

        {/* Status dos Serviços */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Serviços</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant={systemStatus?.recoveryActive ? "default" : "secondary"}>
              {systemStatus?.recoveryActive ? "Auto-recuperação Ativa" : "Auto-recuperação Inativa"}
            </Badge>
            <Badge variant={systemStatus?.stabilityActive ? "default" : "secondary"}>
              {systemStatus?.stabilityActive ? "Monitoramento Ativo" : "Monitoramento Inativo"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
