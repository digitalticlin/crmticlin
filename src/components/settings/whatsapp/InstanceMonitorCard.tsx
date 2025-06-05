
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useInstanceMonitor } from '@/hooks/whatsapp/useInstanceMonitor';
import { useCompanyData } from '@/hooks/useCompanyData';
import { Activity, RefreshCw, Shield, Zap } from 'lucide-react';

export const InstanceMonitorCard = () => {
  const { companyId } = useCompanyData();
  const [autoMonitorEnabled, setAutoMonitorEnabled] = useState(true);
  
  const {
    stats,
    alerts,
    forceCheck,
    clearAlerts,
    isHealthy,
    isCritical
  } = useInstanceMonitor(companyId);

  const handleAutoMonitorToggle = (enabled: boolean) => {
    setAutoMonitorEnabled(enabled);
    // O monitor já está sempre ativo no novo sistema
  };

  return (
    <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" />
          Monitor de Instâncias
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status atual */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status do Monitor</span>
          <Badge variant={stats.totalInstances > 0 ? "default" : "secondary"} className="gap-1">
            <Activity className="h-3 w-3" />
            {stats.totalInstances > 0 ? "Ativo" : "Aguardando"}
          </Badge>
        </div>

        {/* Auto-monitoramento */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Auto-monitoramento (15s)</span>
          <Switch
            checked={autoMonitorEnabled}
            onCheckedChange={handleAutoMonitorToggle}
          />
        </div>

        {/* Botão de execução manual */}
        <Button
          onClick={forceCheck}
          className="w-full gap-2"
          variant="outline"
        >
          <Zap className="h-4 w-4" />
          Verificar Agora
        </Button>

        {/* Estatísticas atuais */}
        {stats.totalInstances > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <h4 className="text-sm font-semibold">Status Atual</h4>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/20 p-2 rounded">
                <div className="font-medium">Total</div>
                <div className="text-blue-600">{stats.totalInstances}</div>
              </div>
              <div className="bg-white/20 p-2 rounded">
                <div className="font-medium">Conectadas</div>
                <div className="text-green-600">{stats.connectedInstances}</div>
              </div>
              <div className="bg-white/20 p-2 rounded">
                <div className="font-medium">Órfãs</div>
                <div className="text-orange-600">{stats.orphanInstances}</div>
              </div>
              <div className="bg-white/20 p-2 rounded">
                <div className="font-medium">Saúde</div>
                <div className={`${isHealthy ? 'text-green-600' : isCritical ? 'text-red-600' : 'text-yellow-600'}`}>
                  {stats.healthScore}%
                </div>
              </div>
            </div>
            
            <div className="text-xs text-gray-500">
              {stats.lastCheck ? new Date(stats.lastCheck).toLocaleString() : 'Nunca verificado'}
            </div>
          </div>
        )}

        {/* Alertas */}
        {alerts.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-red-600">Alertas</h4>
              <Button onClick={clearAlerts} variant="ghost" size="sm">
                Limpar
              </Button>
            </div>
            <div className="space-y-1">
              {alerts.map((alert, index) => (
                <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  {alert}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
