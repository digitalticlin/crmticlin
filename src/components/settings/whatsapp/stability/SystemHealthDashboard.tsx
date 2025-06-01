
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Server, Timer, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { getSystemStatus } from "@/services/whatsapp/config/vpsConfig";
import { VPSHealthMonitor } from "@/services/whatsapp/services/vpsHealthMonitor";
import { StabilityQuarantineManager } from "@/services/whatsapp/services/stabilityQuarantineManager";

export function SystemHealthDashboard() {
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [vpsHealth, setVpsHealth] = useState<any>(null);
  const [quarantineStatus, setQuarantineStatus] = useState<any>(null);

  useEffect(() => {
    const updateStatus = async () => {
      // Sistema geral
      const status = getSystemStatus();
      setSystemStatus(status);

      // Saúde do VPS
      const health = VPSHealthMonitor.getHealthStatus();
      setVpsHealth(health);

      // Status da quarentena
      const quarantine = StabilityQuarantineManager.getQuarantineStatus();
      setQuarantineStatus(quarantine);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 30000); // A cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* VPS Health */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Server className="h-4 w-4" />
            VPS Health
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Status:</span>
            <Badge variant={vpsHealth?.isOnline ? "default" : "destructive"}>
              {vpsHealth?.isOnline ? "Online" : "Offline"}
            </Badge>
          </div>
          
          {vpsHealth?.responseTime && (
            <div className="flex items-center justify-between">
              <span className="text-sm">Latência:</span>
              <Badge variant="outline">
                {vpsHealth.responseTime}ms
              </Badge>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Falhas consecutivas:</span>
            <Badge variant={vpsHealth?.consecutiveFailures > 5 ? "destructive" : "secondary"}>
              {vpsHealth?.consecutiveFailures || 0}
            </Badge>
          </div>

          {vpsHealth?.vpsLoad && (
            <div className="space-y-2 pt-2 border-t">
              <div className="flex justify-between text-xs">
                <span>CPU:</span>
                <span>{vpsHealth.vpsLoad.cpu}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Memória:</span>
                <span>{vpsHealth.vpsLoad.memory}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Conexões:</span>
                <span>{vpsHealth.vpsLoad.activeConnections}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Circuit Breaker */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Circuit Breaker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Estado:</span>
            <Badge variant={systemStatus?.circuitBreaker?.isOpen ? "destructive" : "default"}>
              {systemStatus?.circuitBreaker?.isOpen ? (
                <>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Aberto
                </>
              ) : (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Fechado
                </>
              )}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Falhas:</span>
            <Badge variant="outline">
              {systemStatus?.circuitBreaker?.failureCount || 0}
            </Badge>
          </div>

          {systemStatus?.circuitBreaker?.isOpen && systemStatus?.circuitBreaker?.nextRetryTime && (
            <div className="flex items-center justify-between">
              <span className="text-sm">Próxima tentativa:</span>
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {formatTime(systemStatus.circuitBreaker.nextRetryTime - Date.now())}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rate Limiting */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Timer className="h-4 w-4" />
            Rate Limiting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Calls/min:</span>
            <Badge variant={systemStatus?.rateLimit?.callsThisMinute > 8 ? "destructive" : "default"}>
              {systemStatus?.rateLimit?.callsThisMinute || 0}/10
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Burst atual:</span>
            <Badge variant={systemStatus?.rateLimit?.burstCount > 2 ? "destructive" : "secondary"}>
              {systemStatus?.rateLimit?.burstCount || 0}/3
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Cache Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Server className="h-4 w-4" />
            Cache Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Status cached:</span>
            <Badge variant={systemStatus?.cache?.statusCached ? "default" : "secondary"}>
              {systemStatus?.cache?.statusCached ? "Sim" : "Não"}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Ping cached:</span>
            <Badge variant={systemStatus?.cache?.pingCached ? "default" : "secondary"}>
              {systemStatus?.cache?.pingCached ? "Sim" : "Não"}
            </Badge>
          </div>

          {systemStatus?.cache?.statusAge > 0 && (
            <div className="text-xs text-muted-foreground">
              Status age: {formatTime(systemStatus.cache.statusAge)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quarantine */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Quarentena
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Instâncias:</span>
            <Badge variant={quarantineStatus?.total > 0 ? "destructive" : "default"}>
              {quarantineStatus?.total || 0}
            </Badge>
          </div>

          {quarantineStatus?.instances?.length > 0 && (
            <div className="space-y-1">
              {quarantineStatus.instances.slice(0, 3).map((instance: any, index: number) => (
                <div key={index} className="text-xs p-2 bg-muted rounded">
                  <div className="font-mono">{instance.instanceId.slice(-8)}</div>
                  <div className="text-muted-foreground">
                    {instance.reason} ({formatTime(instance.timeInQuarantine)})
                  </div>
                </div>
              ))}
              {quarantineStatus.instances.length > 3 && (
                <div className="text-xs text-muted-foreground text-center">
                  +{quarantineStatus.instances.length - 3} mais...
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Overview */}
      <Card className="md:col-span-2 lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Sistema Geral
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-muted rounded">
              <div className="font-medium">Monitoramento</div>
              <div className="text-muted-foreground">Conservador</div>
            </div>
            <div className="p-2 bg-muted rounded">
              <div className="font-medium">Recovery</div>
              <div className="text-muted-foreground">Auto 1h</div>
            </div>
            <div className="p-2 bg-muted rounded">
              <div className="font-medium">Quarentena</div>
              <div className="text-muted-foreground">24h</div>
            </div>
            <div className="p-2 bg-muted rounded">
              <div className="font-medium">Timeouts</div>
              <div className="text-muted-foreground">Otimizados</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
