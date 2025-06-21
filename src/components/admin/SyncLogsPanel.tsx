
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, FileText, CheckCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SyncLog {
  id: string;
  function_name: string;
  status: string;
  execution_time?: string;
  result?: any;
  error_message?: string;
  created_at: string;
}

export const SyncLogsPanel = () => {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      setLogs(data || []);
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      toast.error('Erro ao carregar logs de sincronização');
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = async () => {
    if (!confirm('Tem certeza que deseja limpar todos os logs?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('sync_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) throw error;
      
      setLogs([]);
      toast.success('Logs limpos com sucesso');
    } catch (error) {
      console.error('Erro ao limpar logs:', error);
      toast.error('Erro ao limpar logs');
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'success') {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Sucesso</Badge>;
    } else if (status === 'error') {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Erro</Badge>;
    } else {
      return <Badge variant="secondary">{status}</Badge>;
    }
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Logs de Sincronização
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchLogs} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button onClick={clearLogs} size="sm" variant="destructive">
              Limpar Logs
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum log de sincronização encontrado
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(log.status)}
                    <span className="font-medium">{log.function_name}</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
                
                {log.execution_time && (
                  <div className="text-sm text-gray-600">
                    <strong>Tempo de execução:</strong> {log.execution_time}
                  </div>
                )}

                {log.result && (
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <strong>Resultado:</strong>
                    <pre className="text-xs mt-1 overflow-x-auto">
                      {JSON.stringify(log.result, null, 2)}
                    </pre>
                  </div>
                )}

                {log.error_message && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded text-sm">
                    <strong className="text-red-800">Erro:</strong>
                    <p className="text-red-700 mt-1">{log.error_message}</p>
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
