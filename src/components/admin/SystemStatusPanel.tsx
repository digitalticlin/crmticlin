
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, RefreshCw, Clock, Activity } from "lucide-react";
import { useSystemMonitoring, SystemStatus } from "@/hooks/useSystemMonitoring";
import { Button } from "@/components/ui/button";

export function SystemStatusPanel() {
  const { systemStatus, refreshStatus } = useSystemMonitoring();
  
  // Format last check time
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  // Get status badge for component
  const getStatusBadge = (status: 'online' | 'degraded' | 'offline') => {
    switch (status) {
      case 'online':
        return (
          <Badge className="bg-green-500 hover:bg-green-600 text-white">
            <CheckCircle className="h-3 w-3 mr-1" /> Online
          </Badge>
        );
      case 'degraded':
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
            <AlertCircle className="h-3 w-3 mr-1" /> Degradado
          </Badge>
        );
      case 'offline':
        return (
          <Badge className="bg-red-500 hover:bg-red-600 text-white">
            <AlertCircle className="h-3 w-3 mr-1" /> Offline
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Status do Sistema</CardTitle>
            <CardDescription>Monitoramento em tempo real</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={refreshStatus}>
            <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* WhatsApp Instances */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Instâncias WhatsApp</span>
              <span className="text-xs text-muted-foreground">
                {systemStatus.whatsappInstances.connected} de {systemStatus.whatsappInstances.total} conectadas
              </span>
            </div>
            <Progress 
              value={systemStatus.whatsappInstances.total > 0 
                ? (systemStatus.whatsappInstances.connected / systemStatus.whatsappInstances.total) * 100 
                : 0
              }
              className="h-2"
            />
            <div className="mt-2 flex gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200">
                {systemStatus.whatsappInstances.connected} Conectadas
              </Badge>
              <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200">
                {systemStatus.whatsappInstances.disconnected} Desconectadas
              </Badge>
              {systemStatus.whatsappInstances.connecting > 0 && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200">
                  {systemStatus.whatsappInstances.connecting} Conectando
                </Badge>
              )}
            </div>
          </div>
          
          {/* Database Status */}
          <div className="flex items-center justify-between p-2 border rounded-md">
            <div className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-primary" />
              <div>
                <div className="text-sm font-medium">Banco de Dados</div>
                <div className="text-xs text-muted-foreground flex items-center">
                  <Clock className="h-3 w-3 mr-1" /> 
                  Última verificação: {formatTime(systemStatus.database.lastChecked)}
                </div>
              </div>
            </div>
            {getStatusBadge(systemStatus.database.status)}
          </div>
          
          {/* API Status */}
          <div className="flex items-center justify-between p-2 border rounded-md">
            <div className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-primary" />
              <div>
                <div className="text-sm font-medium">API Evolution</div>
                <div className="text-xs text-muted-foreground flex items-center">
                  <Clock className="h-3 w-3 mr-1" /> 
                  Latência: {systemStatus.api.latency}ms
                </div>
              </div>
            </div>
            {getStatusBadge(systemStatus.api.status)}
          </div>
          
          {/* Errors Summary */}
          {systemStatus.errors.count > 0 && systemStatus.errors.lastError && (
            <div className="mt-4">
              <div className="text-sm font-medium text-red-500 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                Erros recentes: {systemStatus.errors.count}
              </div>
              <div className="text-xs mt-1 p-2 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 rounded border border-red-200">
                <div className="font-medium">{systemStatus.errors.lastError.message}</div>
                <div className="mt-1 text-xs text-red-600 dark:text-red-300">
                  {formatTime(systemStatus.errors.lastError.timestamp)}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default SystemStatusPanel;
