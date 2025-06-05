
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Clock, CheckCircle2, AlertCircle, RotateCcw, Play } from "lucide-react";

interface SyncLog {
  id: string;
  execution_time: string;
  status: string;
  instances_found: number;
  instances_added: number;
  instances_updated: number;
  errors_count: number;
  execution_duration_ms: number;
  error_details: any;
}

export const AutoSyncMonitor = () => {
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualSyncLoading, setManualSyncLoading] = useState(false);

  const fetchSyncLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('auto_sync_logs')
        .select('*')
        .order('execution_time', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSyncLogs(data || []);
    } catch (error) {
      console.error('Erro ao buscar logs de sincronização:', error);
      toast.error('Erro ao carregar logs de sincronização');
    } finally {
      setLoading(false);
    }
  };

  const triggerManualSync = async () => {
    setManualSyncLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('auto_whatsapp_sync');

      if (error) throw error;

      toast.success('Sincronização manual executada com sucesso!');
      setTimeout(fetchSyncLogs, 2000); // Recarregar logs após 2 segundos
    } catch (error) {
      console.error('Erro na sincronização manual:', error);
      toast.error('Erro ao executar sincronização manual');
    } finally {
      setManualSyncLoading(false);
    }
  };

  useEffect(() => {
    fetchSyncLogs();
    
    // Recarregar logs a cada 30 segundos
    const interval = setInterval(fetchSyncLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'partial':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const lastSync = syncLogs[0];
  const isRecentSync = lastSync && 
    new Date().getTime() - new Date(lastSync.execution_time).getTime() < 10 * 60 * 1000; // Últimos 10 minutos

  return (
    <div className="space-y-6">
      {/* Status da Sincronização Automática */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Status da Sincronização Automática
            </div>
            <Button 
              onClick={triggerManualSync}
              disabled={manualSyncLoading}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {manualSyncLoading ? (
                <RotateCcw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Executar Agora
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isRecentSync ? 'bg-green-500' : 'bg-red-500'}`} />
              <div>
                <p className="text-sm font-medium">Sistema de Sync</p>
                <p className="text-xs text-gray-600">
                  {isRecentSync ? 'Ativo' : 'Inativo'}
                </p>
              </div>
            </div>
            
            {lastSync && (
              <>
                <div className="flex items-center gap-3">
                  {getStatusIcon(lastSync.status)}
                  <div>
                    <p className="text-sm font-medium">Última Execução</p>
                    <p className="text-xs text-gray-600">
                      {new Date(lastSync.execution_time).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Duração</p>
                    <p className="text-xs text-gray-600">
                      {lastSync.execution_duration_ms}ms
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Sincronizações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Histórico de Sincronizações</span>
            <Button 
              onClick={fetchSyncLogs}
              disabled={loading}
              variant="ghost"
              size="sm"
            >
              <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : syncLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum log de sincronização encontrado
              </div>
            ) : (
              syncLogs.map(log => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(log.status)}
                      <Badge className={getStatusColor(log.status)}>
                        {log.status}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {new Date(log.execution_time).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {log.execution_duration_ms}ms
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Encontradas:</span>
                      <span className="ml-1">{log.instances_found}</span>
                    </div>
                    <div>
                      <span className="font-medium text-green-600">Adicionadas:</span>
                      <span className="ml-1">{log.instances_added}</span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-600">Atualizadas:</span>
                      <span className="ml-1">{log.instances_updated}</span>
                    </div>
                    <div>
                      <span className="font-medium text-red-600">Erros:</span>
                      <span className="ml-1">{log.errors_count}</span>
                    </div>
                  </div>
                  
                  {log.error_details && (
                    <div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-700">
                      <strong>Detalhes dos erros:</strong>
                      <pre className="mt-1 whitespace-pre-wrap">
                        {JSON.stringify(log.error_details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
