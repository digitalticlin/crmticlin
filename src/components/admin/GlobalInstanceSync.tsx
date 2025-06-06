
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCcw, Database, AlertTriangle, CheckCircle, XCircle, Loader2, Globe, Settings, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SyncResult {
  success: boolean;
  data?: {
    syncId?: string;
    syncedCount: number;
    createdCount: number;
    updatedCount: number;
    errorCount?: number;
    vpsInstancesCount: number;
    supabaseInstancesCount: number;
    syncLog?: string[];
    message: string;
  };
  error?: string;
}

export const GlobalInstanceSync = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [isStatusSync, setIsStatusSync] = useState(false);
  const [isOrphanSync, setIsOrphanSync] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[Global Sync UI] ${message}`);
  };

  const executeGlobalSync = async () => {
    setIsRunning(true);
    setLogs([]);
    setResult(null);
    
    addLog("🚀 Iniciando sincronização global de instâncias...");
    addLog("📡 Esta operação pode levar alguns segundos...");

    try {
      addLog("🔐 Verificando autenticação...");
      
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'sync_all_instances'
        }
      });

      addLog("📥 Resposta recebida do servidor");

      if (error) {
        addLog(`❌ Erro na requisição: ${error.message}`);
        console.error('[Global Sync UI] Supabase function error:', error);
        throw error;
      }

      console.log('[Global Sync UI] Resposta completa:', data);

      if (data && data.success) {
        const summary = data.data || data.summary || {};
        
        addLog(`✅ Sincronização concluída com sucesso!`);
        addLog(`🆕 Instâncias criadas: ${summary.createdCount || summary.created || 0}`);
        addLog(`🔄 Instâncias atualizadas: ${summary.updatedCount || summary.updated || 0}`);
        addLog(`📊 Total VPS: ${summary.vpsInstancesCount || summary.total_vps_instances || 0}`);
        addLog(`💾 Total Supabase: ${summary.supabaseInstancesCount || summary.total_db_instances || 0}`);
        
        if (summary.errorCount && summary.errorCount > 0) {
          addLog(`⚠️ Erros encontrados: ${summary.errorCount}`);
        }

        // Adicionar logs detalhados se disponíveis
        if (summary.syncLog && Array.isArray(summary.syncLog)) {
          addLog("📋 Detalhes da sincronização:");
          summary.syncLog.forEach((logEntry: string) => {
            addLog(`  ${logEntry}`);
          });
        }
        
        setResult({
          success: true,
          data: {
            syncId: summary.syncId || 'unknown',
            syncedCount: summary.syncedCount || (summary.updatedCount + summary.createdCount) || 0,
            createdCount: summary.createdCount || summary.created || 0,
            updatedCount: summary.updatedCount || summary.updated || 0,
            errorCount: summary.errorCount || 0,
            vpsInstancesCount: summary.vpsInstancesCount || summary.total_vps_instances || 0,
            supabaseInstancesCount: summary.supabaseInstancesCount || summary.total_db_instances || 0,
            syncLog: summary.syncLog || [],
            message: data.message || summary.message || 'Sincronização global executada com sucesso'
          }
        });

        const successMessage = summary.createdCount > 0 
          ? `Sincronização concluída! ${summary.createdCount} instâncias órfãs adicionadas ao Supabase`
          : `Sincronização concluída! ${summary.updatedCount || 0} instâncias atualizadas`;
        
        toast.success(successMessage);
      } else {
        const errorMessage = data?.error || 'Erro desconhecido na sincronização';
        addLog(`❌ Falha na sincronização: ${errorMessage}`);
        
        // Log adicional de debugging
        addLog("🔍 Dados de debug do erro:");
        if (data?.details) {
          addLog(`   VPS URL: ${data.details.vps_url || 'N/A'}`);
          addLog(`   Headers: ${JSON.stringify(data.details.vps_headers || {})}`);
        }
        
        setResult({
          success: false,
          error: errorMessage
        });
        
        toast.error(`Falha na sincronização: ${errorMessage}`);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Erro inesperado';
      addLog(`💥 Erro inesperado: ${errorMessage}`);
      
      console.error('[Global Sync UI] Unexpected error:', error);
      
      setResult({
        success: false,
        error: errorMessage
      });
      
      toast.error(`Erro na sincronização: ${errorMessage}`);
    } finally {
      setIsRunning(false);
      addLog("🏁 Processo de sincronização finalizado");
    }
  };

  const executeStatusSync = async () => {
    setIsStatusSync(true);
    setLogs([]);
    setResult(null);
    
    addLog("🔧 Iniciando sincronização de status e configuração de webhooks...");
    addLog("⚙️ Configurando webhooks na VPS e atualizando status...");

    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'sync_status_webhooks'
        }
      });

      if (error) {
        addLog(`❌ Erro na requisição: ${error.message}`);
        throw error;
      }

      if (data && data.success) {
        const summary = data.data || {};
        
        addLog(`✅ Sincronização de status concluída!`);
        addLog(`🔗 Webhooks configurados: ${summary.webhooksConfigured || 0}`);
        addLog(`🔄 Status atualizados: ${summary.statusUpdated || 0}`);
        addLog(`📊 Instâncias processadas: ${summary.processedCount || 0}`);
        
        setResult({
          success: true,
          data: {
            syncId: summary.syncId || 'status-sync',
            syncedCount: summary.statusUpdated || 0,
            createdCount: 0,
            updatedCount: summary.statusUpdated || 0,
            errorCount: summary.errorCount || 0,
            vpsInstancesCount: summary.processedCount || 0,
            supabaseInstancesCount: summary.statusUpdated || 0,
            syncLog: summary.syncLog || [],
            message: 'Webhooks configurados e status sincronizados com sucesso'
          }
        });

        toast.success(`Status sincronizado! ${summary.statusUpdated || 0} instâncias atualizadas`);
      } else {
        const errorMessage = data?.error || 'Erro desconhecido na sincronização de status';
        addLog(`❌ Falha na sincronização: ${errorMessage}`);
        
        setResult({
          success: false,
          error: errorMessage
        });
        
        toast.error(`Falha na sincronização: ${errorMessage}`);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Erro inesperado';
      addLog(`💥 Erro inesperado: ${errorMessage}`);
      
      setResult({
        success: false,
        error: errorMessage
      });
      
      toast.error(`Erro na sincronização: ${errorMessage}`);
    } finally {
      setIsStatusSync(false);
      addLog("🏁 Sincronização de status finalizada");
    }
  };

  const executeOrphanSync = async () => {
    setIsOrphanSync(true);
    setLogs([]);
    setResult(null);
    
    addLog("👥 Iniciando sincronização de instâncias órfãs...");
    addLog("🔍 Buscando instâncias não vinculadas na VPS...");

    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'sync_orphan_instances'
        }
      });

      if (error) {
        addLog(`❌ Erro na requisição: ${error.message}`);
        throw error;
      }

      if (data && data.success) {
        const summary = data.data || {};
        
        addLog(`✅ Sincronização de órfãs concluída!`);
        addLog(`🆕 Órfãs importadas: ${summary.orphansImported || 0}`);
        addLog(`🔄 Órfãs atualizadas: ${summary.orphansUpdated || 0}`);
        addLog(`📊 Total processadas: ${summary.totalProcessed || 0}`);
        
        setResult({
          success: true,
          data: {
            syncId: summary.syncId || 'orphan-sync',
            syncedCount: summary.orphansImported || 0,
            createdCount: summary.orphansImported || 0,
            updatedCount: summary.orphansUpdated || 0,
            errorCount: summary.errorCount || 0,
            vpsInstancesCount: summary.totalProcessed || 0,
            supabaseInstancesCount: summary.orphansImported || 0,
            syncLog: summary.syncLog || [],
            message: 'Instâncias órfãs importadas com sucesso'
          }
        });

        toast.success(`Órfãs sincronizadas! ${summary.orphansImported || 0} instâncias importadas`);
      } else {
        const errorMessage = data?.error || 'Erro desconhecido na sincronização de órfãs';
        addLog(`❌ Falha na sincronização: ${errorMessage}`);
        
        setResult({
          success: false,
          error: errorMessage
        });
        
        toast.error(`Falha na sincronização: ${errorMessage}`);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Erro inesperado';
      addLog(`💥 Erro inesperado: ${errorMessage}`);
      
      setResult({
        success: false,
        error: errorMessage
      });
      
      toast.error(`Erro na sincronização: ${errorMessage}`);
    } finally {
      setIsOrphanSync(false);
      addLog("🏁 Sincronização de órfãs finalizada");
    }
  };

  return (
    <div className="space-y-6">
      {/* Controles Principais */}
      <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            Sincronização Global de Instâncias
          </CardTitle>
          <p className="text-sm text-gray-600">
            Gerencie e sincronize todas as instâncias da VPS com o Supabase
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sincronização Completa */}
          <Button
            onClick={executeGlobalSync}
            disabled={isRunning || isStatusSync || isOrphanSync}
            className="gap-2 w-full"
            size="lg"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCcw className="h-4 w-4" />
                Sincronização Completa
              </>
            )}
          </Button>

          <Separator />

          {/* Sincronizações Específicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sincronizar Status */}
            <Button
              onClick={executeStatusSync}
              disabled={isRunning || isStatusSync || isOrphanSync}
              variant="outline"
              className="gap-2 h-auto p-4 flex-col items-start"
            >
              {isStatusSync ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Configurando...
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 w-full">
                    <Settings className="h-4 w-4" />
                    <span className="font-medium">Sincronizar Status</span>
                  </div>
                  <span className="text-xs text-gray-500 text-left">
                    Configura webhooks e atualiza status de instâncias conectadas
                  </span>
                </>
              )}
            </Button>

            {/* Sincronizar Órfãs */}
            <Button
              onClick={executeOrphanSync}
              disabled={isRunning || isStatusSync || isOrphanSync}
              variant="outline"
              className="gap-2 h-auto p-4 flex-col items-start"
            >
              {isOrphanSync ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 w-full">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">Sincronizar Órfãs</span>
                  </div>
                  <span className="text-xs text-gray-500 text-left">
                    Importa instâncias não vinculadas da VPS
                  </span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {result && (
        <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-green-500" />
              Resultado da Sincronização
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Geral */}
            <div className="flex items-center justify-between p-4 bg-white/20 rounded-lg">
              <span className="font-medium">Status da Sincronização</span>
              <Badge variant={result.success ? "default" : "destructive"} className="gap-1">
                {result.success ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {result.success ? "Sucesso" : "Falha"}
              </Badge>
            </div>

            {result.success && result.data && (
              <>
                <Separator />

                {/* Estatísticas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {result.data.createdCount}
                    </div>
                    <div className="text-sm text-green-700">Criadas</div>
                  </div>
                  
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {result.data.updatedCount}
                    </div>
                    <div className="text-sm text-blue-700">Atualizadas</div>
                  </div>
                  
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {result.data.vpsInstancesCount}
                    </div>
                    <div className="text-sm text-purple-700">Total VPS</div>
                  </div>
                  
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {result.data.supabaseInstancesCount}
                    </div>
                    <div className="text-sm text-orange-700">Total Supabase</div>
                  </div>
                </div>

                {/* Mostrar erros se houver */}
                {result.data.errorCount && result.data.errorCount > 0 && (
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <p className="text-yellow-800 font-medium">
                      ⚠️ {result.data.errorCount} erro(s) encontrado(s) durante a sincronização
                    </p>
                    <p className="text-yellow-700 text-sm mt-1">
                      Verifique os logs para mais detalhes
                    </p>
                  </div>
                )}

                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-green-800 font-medium">
                    ✅ {result.data.message}
                  </p>
                  {result.data.createdCount > 0 && (
                    <p className="text-green-700 text-sm mt-1">
                      {result.data.createdCount} instâncias órfãs foram adicionadas ao Supabase e agora podem ser vinculadas a usuários.
                    </p>
                  )}
                  {result.data.syncId && (
                    <p className="text-green-600 text-xs mt-2">
                      ID da Sincronização: {result.data.syncId}
                    </p>
                  )}
                </div>
              </>
            )}

            {!result.success && result.error && (
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-red-800 font-medium">
                  ❌ Erro na sincronização
                </p>
                <p className="text-red-700 text-sm mt-1">
                  {result.error}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Logs */}
      {logs.length > 0 && (
        <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-sm">Logs de Execução</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-40 w-full">
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="text-xs font-mono bg-black/10 p-2 rounded">
                    {log}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-blue-500" />
            Como funcionam as sincronizações
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-3">
          <div>
            <p className="font-medium text-gray-800 mb-1">🔄 Sincronização Completa:</p>
            <p>• Busca todas as instâncias da VPS e compara com o Supabase</p>
            <p>• Cria instâncias órfãs e atualiza dados existentes</p>
          </div>
          
          <div>
            <p className="font-medium text-gray-800 mb-1">⚙️ Sincronizar Status:</p>
            <p>• Configura webhooks globais na VPS</p>
            <p>• Atualiza status de instâncias conectadas que não atualizaram automaticamente</p>
            <p>• Ideal para instâncias criadas antes da configuração de webhooks</p>
          </div>
          
          <div>
            <p className="font-medium text-gray-800 mb-1">👥 Sincronizar Órfãs:</p>
            <p>• Importa instâncias da VPS que não estão no Supabase</p>
            <p>• Cria registros com `created_by_user_id = NULL`</p>
            <p>• Permite gerenciamento manual posterior (excluir ou vincular usuários)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
