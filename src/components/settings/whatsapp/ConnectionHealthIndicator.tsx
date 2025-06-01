
import { useConnectionHealth } from "@/hooks/whatsapp/useConnectionHealth";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Heart, AlertTriangle, Wifi, WifiOff } from "lucide-react";

interface ConnectionHealthIndicatorProps {
  instanceId: string;
  vpsInstanceId?: string;
  className?: string;
}

export function ConnectionHealthIndicator({ 
  instanceId, 
  vpsInstanceId, 
  className = "" 
}: ConnectionHealthIndicatorProps) {
  const { healthStatus, isHealthy, consecutiveFailures, needsReconnection } = useConnectionHealth(instanceId);

  if (!vpsInstanceId) {
    return null;
  }

  const getHealthIcon = () => {
    if (needsReconnection) {
      return <WifiOff className="h-3 w-3" />;
    }
    if (!isHealthy) {
      return <AlertTriangle className="h-3 w-3" />;
    }
    return <Heart className="h-3 w-3 text-green-500" />;
  };

  const getHealthBadge = () => {
    if (needsReconnection) {
      return (
        <Badge variant="destructive" className={`text-xs ${className}`}>
          {getHealthIcon()}
          <span className="ml-1">Reconectando</span>
        </Badge>
      );
    }
    
    if (!isHealthy && consecutiveFailures > 0) {
      return (
        <Badge variant="secondary" className={`text-xs ${className}`}>
          {getHealthIcon()}
          <span className="ml-1">Instável ({consecutiveFailures})</span>
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className={`text-xs border-green-200 ${className}`}>
        {getHealthIcon()}
        <span className="ml-1">Saudável</span>
      </Badge>
    );
  };

  const getTooltipContent = () => {
    if (!healthStatus) {
      return "Status de saúde não disponível";
    }

    const lastHeartbeat = new Date(healthStatus.lastHeartbeat);
    const timeSince = Math.floor((Date.now() - lastHeartbeat.getTime()) / 1000);

    return (
      <div className="text-xs">
        <div>Último heartbeat: {timeSince}s atrás</div>
        <div>Falhas consecutivas: {consecutiveFailures}</div>
        <div>Status: {isHealthy ? 'Saudável' : 'Com problemas'}</div>
        {needsReconnection && <div className="text-orange-200">Tentativa de reconexão em andamento</div>}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex">
            {getHealthBadge()}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
