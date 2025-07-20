
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Activity, Clock, CheckCircle2, XCircle, AlertTriangle, RefreshCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SyncLog {
  id: string;
  status: string;
  execution_time: string;
  instances_found: number;
  instances_added: number;
  instances_updated: number;
  errors_count: number;
  execution_duration_ms: number;
  error_details: any;
  created_at: string;
}

export const AutoSyncMonitor = () => {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    averageDuration: 0,
    lastExecution: null as string | null
  });

  const loadSyncLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('auto_sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Erro ao carregar logs:', error);
        toast.error('Erro ao carregar logs de sincronização');
        return;
      }

      setLogs(data || []);

      // Calcular estatísticas
      if (data && data.length > 0) {
        const total = data.length;
        const successful = data.filter(log => log.status === 'success').length;
        const failed = total - successful;
        const avgDuration = data.reduce((acc, log) => acc + (log.execution_duration_ms || 0), 0) / total;

        setStats({
          totalExecutions: total,
          successfulExecutions: successful,
          failedExecutions: failed,
          averageDuration: Math.round(avgDuration),
          lastExecution: data[0].created_at
        });
      }

    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSyncLogs();
    
    // Recarregar a cada 30 segundos
    const interval = setInterval(loadSyncLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Sucesso</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Execuções</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExecutions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sucessos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.successfulExecutions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalExecutions > 0 ? Math.round((stats.successfulExecutions / stats.totalExecutions) * 100) : 0}% de sucesso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Falhas</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failedExecutions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalExecutions > 0 ? Math.round((stats.failedExecutions / stats.totalExecutions) * 100) : 0}% de falha
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duração Média</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(stats.averageDuration)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.lastExecution ? `Última: ${new Date(stats.lastExecution).toLocaleTimeString('pt-BR')}` : 'Nenhuma execução'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Histórico de Sincronizações
            </div>
            <Button
              onClick={loadSyncLogs}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Atualizar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum log de sincronização encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(log.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(log.status)}
                        <span className="text-sm font-medium">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Encontradas: {log.instances_found || 0} | 
                        Adicionadas: {log.instances_added || 0} | 
                        Atualizadas: {log.instances_updated || 0}
                        {log.errors_count > 0 && ` | Erros: ${log.errors_count}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {formatDuration(log.execution_duration_ms || 0)}
                    </div>
                    {log.error_details && (
                      <div className="text-xs text-red-600 max-w-xs truncate">
                        {JSON.stringify(log.error_details)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
