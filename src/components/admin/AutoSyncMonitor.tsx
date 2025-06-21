
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SyncLog {
  id: string;
  execution_time: string;
  status: string;
  instances_found: number;
  instances_added: number;
  instances_updated: number;
  errors_count: number;
  execution_duration_ms?: number;
  error_details?: any;
  created_at: string;
}

export const AutoSyncMonitor = () => {
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSyncLogs();
  }, []);

  const fetchSyncLogs = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('auto_sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      setSyncLogs(data || []);
    } catch (error) {
      console.error('Erro ao buscar logs de sincronização:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'success') {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Sucesso</Badge>;
    } else if (status === 'error') {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Erro</Badge>;
    } else {
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Processando</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Monitor de Sincronização Automática
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Monitor de Sincronização Automática
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {syncLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum log de sincronização encontrado
            </div>
          ) : (
            syncLogs.map((log) => (
              <div key={log.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(log.status)}
                    <span className="text-sm text-gray-600">
                      {new Date(log.execution_time).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  {log.execution_duration_ms && (
                    <span className="text-xs text-gray-500">
                      {log.execution_duration_ms}ms
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Encontradas:</span>
                    <p className="text-blue-600">{log.instances_found}</p>
                  </div>
                  <div>
                    <span className="font-medium">Adicionadas:</span>
                    <p className="text-green-600">{log.instances_added}</p>
                  </div>
                  <div>
                    <span className="font-medium">Atualizadas:</span>
                    <p className="text-orange-600">{log.instances_updated}</p>
                  </div>
                  <div>
                    <span className="font-medium">Erros:</span>
                    <p className="text-red-600">{log.errors_count}</p>
                  </div>
                </div>

                {log.error_details && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                    <strong>Detalhes do erro:</strong>
                    <pre className="text-xs mt-1 overflow-x-auto">
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
  );
};
