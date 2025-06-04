
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useInstanceMonitor } from '@/hooks/whatsapp/useInstanceMonitor';
import { Activity, RefreshCw, Shield, Zap } from 'lucide-react';

export const InstanceMonitorCard = () => {
  const {
    isMonitoring,
    lastResult,
    autoMonitorEnabled,
    runMonitoring,
    enableAutoMonitor,
    disableAutoMonitor
  } = useInstanceMonitor();

  const handleAutoMonitorToggle = (enabled: boolean) => {
    if (enabled) {
      enableAutoMonitor();
    } else {
      disableAutoMonitor();
    }
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
          <Badge variant={isMonitoring ? "default" : "secondary"} className="gap-1">
            <Activity className="h-3 w-3" />
            {isMonitoring ? "Executando" : "Parado"}
          </Badge>
        </div>

        {/* Auto-monitoramento */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Auto-monitoramento (2min)</span>
          <Switch
            checked={autoMonitorEnabled}
            onCheckedChange={handleAutoMonitorToggle}
            disabled={isMonitoring}
          />
        </div>

        {/* Botão de execução manual */}
        <Button
          onClick={runMonitoring}
          disabled={isMonitoring}
          className="w-full gap-2"
          variant="outline"
        >
          {isMonitoring ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          {isMonitoring ? "Monitorando..." : "Executar Monitoramento"}
        </Button>

        {/* Último resultado */}
        {lastResult && (
          <div className="space-y-2 pt-2 border-t">
            <h4 className="text-sm font-semibold">Último Resultado</h4>
            
            {lastResult.success && lastResult.results ? (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/20 p-2 rounded">
                  <div className="font-medium">Monitoradas</div>
                  <div className="text-blue-600">{lastResult.results.monitored}</div>
                </div>
                <div className="bg-white/20 p-2 rounded">
                  <div className="font-medium">Órfãs</div>
                  <div className="text-orange-600">{lastResult.results.orphans_found}</div>
                </div>
                <div className="bg-white/20 p-2 rounded">
                  <div className="font-medium">Adotadas</div>
                  <div className="text-green-600">{lastResult.results.adopted}</div>
                </div>
                <div className="bg-white/20 p-2 rounded">
                  <div className="font-medium">Limpas</div>
                  <div className="text-red-600">{lastResult.results.deleted}</div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                Erro: {lastResult.error || 'Falha desconhecida'}
              </div>
            )}
            
            <div className="text-xs text-gray-500">
              {new Date(lastResult.timestamp).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
