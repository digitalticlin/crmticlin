
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCcw, Database, AlertTriangle, CheckCircle, XCircle, Loader2, Globe } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SyncResult {
  success: boolean;
  data?: {
    syncedCount: number;
    createdCount: number;
    updatedCount: number;
    vpsInstancesCount: number;
    supabaseInstancesCount: number;
    message: string;
  };
  error?: string;
}

export const GlobalInstanceSync = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[Global Sync] ${message}`);
  };

  const executeGlobalSync = async () => {
    setIsRunning(true);
    setLogs([]);
    setResult(null);
    
    addLog("🚀 Iniciando sincronização global de instâncias...");

    try {
      addLog("📡 Enviando requisição para sincronizar todas as instâncias...");
      
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'sync_instances'
        }
      });

      if (error) {
        addLog(`❌ Erro na requisição: ${error.message}`);
        throw error;
      }

      addLog("✅ Resposta recebida da sincronização");
      console.log('[Global Sync] Resposta completa:', data);

      if (data && data.success) {
        const summary = data.data || data.summary || {};
        
        addLog(`📊 Sincronização concluída com sucesso!`);
        addLog(`🔄 Instâncias atualizadas: ${summary.updatedCount || summary.updated || 0}`);
        addLog(`🆕 Instâncias criadas: ${summary.createdCount || summary.created || 0}`);
        addLog(`📋 Total VPS: ${summary.vpsInstancesCount || summary.total_vps_instances || 0}`);
        addLog(`💾 Total Supabase: ${summary.supabaseInstancesCount || summary.total_db_instances || 0}`);
        
        setResult({
          success: true,
          data: {
            syncedCount: summary.syncedCount || (summary.updatedCount + summary.createdCount) || 0,
            createdCount: summary.createdCount || summary.created || 0,
            updatedCount: summary.updatedCount || summary.updated || 0,
            vpsInstancesCount: summary.vpsInstancesCount || summary.total_vps_instances || 0,
            supabaseInstancesCount: summary.supabaseInstancesCount || summary.total_db_instances || 0,
            message: data.message || 'Sincronização global executada com sucesso'
          }
        });

        toast.success(`Sincronização concluída! ${summary.createdCount || 0} instâncias órfãs adicionadas ao Supabase`);
      } else {
        const errorMessage = data?.error || 'Erro desconhecido na sincronização';
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
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controles */}
      <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            Sincronização Global de Instâncias
          </CardTitle>
          <p className="text-sm text-gray-600">
            Sincroniza todas as instâncias da VPS para o Supabase, incluindo órfãs
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={executeGlobalSync}
            disabled={isRunning}
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
                Executar Sincronização Global
              </>
            )}
          </Button>
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

                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-green-800 font-medium">
                    ✅ {result.data.message}
                  </p>
                  {result.data.createdCount > 0 && (
                    <p className="text-green-700 text-sm mt-1">
                      {result.data.createdCount} instâncias órfãs foram adicionadas ao Supabase e agora podem ser vinculadas a usuários.
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

      {/* Informações sobre o processo */}
      <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-blue-500" />
            Como funciona a sincronização
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>• <strong>Busca todas as instâncias</strong> - Consulta a VPS para obter todas as instâncias ativas</p>
          <p>• <strong>Compara com o Supabase</strong> - Verifica quais instâncias já existem no banco</p>
          <p>• <strong>Cria instâncias órfãs</strong> - Adiciona instâncias que existem na VPS mas não no Supabase</p>
          <p>• <strong>Atualiza dados existentes</strong> - Sincroniza informações das instâncias já cadastradas</p>
          <p>• <strong>Resultado</strong> - Após a sincronização, todas as instâncias órfãs ficarão visíveis no painel de gerenciamento</p>
        </CardContent>
      </Card>
    </div>
  );
};
