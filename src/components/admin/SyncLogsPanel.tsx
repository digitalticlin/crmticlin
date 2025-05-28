
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCcw, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SyncLog {
  id: string;
  function_name: string;
  status: string;
  execution_time: string;
  result: any;
  error_message: string;
  created_at: string;
}

export const SyncLogsPanel = () => {
  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['sync-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as SyncLog[];
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="outline" className="text-green-600 border-green-600">Sucesso</Badge>;
      case 'error':
        return <Badge variant="outline" className="text-red-600 border-red-600">Erro</Badge>;
      default:
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Desconhecido</Badge>;
    }
  };

  const formatExecutionTime = (timeStr: string) => {
    if (!timeStr) return 'N/A';
    const match = timeStr.match(/(\d+) milliseconds/);
    if (match) {
      const ms = parseInt(match[1]);
      if (ms < 1000) return `${ms}ms`;
      return `${(ms / 1000).toFixed(1)}s`;
    }
    return timeStr;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Logs de Sincronização Automática</h2>
          <p className="text-muted-foreground">
            Histórico das execuções automáticas de sincronização WhatsApp
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="gap-2">
          <RefreshCcw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCcw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {logs && logs.length > 0 ? (
            logs.map((log) => (
              <Card key={log.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(log.status)}
                      <CardTitle className="text-lg">{log.function_name}</CardTitle>
                      {getStatusBadge(log.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatExecutionTime(log.execution_time)}
                      </div>
                      <span>
                        {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {log.status === 'error' && log.error_message && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-700 font-medium">Erro:</p>
                      <p className="text-sm text-red-600">{log.error_message}</p>
                    </div>
                  )}
                  
                  {log.result && log.status === 'success' && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <div className="font-semibold text-blue-600">
                            {log.result.summary?.updated || 0}
                          </div>
                          <div className="text-blue-500">Atualizadas</div>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded">
                          <div className="font-semibold text-green-600">
                            {log.result.summary?.inserted || 0}
                          </div>
                          <div className="text-green-500">Inseridas</div>
                        </div>
                        <div className="text-center p-2 bg-red-50 rounded">
                          <div className="font-semibold text-red-600">
                            {log.result.summary?.deleted || 0}
                          </div>
                          <div className="text-red-500">Removidas</div>
                        </div>
                        <div className="text-center p-2 bg-yellow-50 rounded">
                          <div className="font-semibold text-yellow-600">
                            {log.result.summary?.errors || 0}
                          </div>
                          <div className="text-yellow-500">Erros</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="font-semibold text-gray-600">
                            {log.result.total_evolution_instances || 0}
                          </div>
                          <div className="text-gray-500">Total Evolution</div>
                        </div>
                      </div>
                      
                      {log.result.auto_sync && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <AlertCircle className="h-4 w-4" />
                          <span>Execução automática (cron job)</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum log de sincronização encontrado</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
