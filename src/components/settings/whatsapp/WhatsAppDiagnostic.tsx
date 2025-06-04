
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCcw, Database, Server, AlertTriangle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface VPSInstance {
  instanceId: string;
  status: string;
  phone?: string;
  profileName?: string;
}

interface DBInstance {
  id: string;
  instance_name: string;
  vps_instance_id: string;
  connection_status: string;
  phone: string;
  company_id: string;
}

interface DiagnosticResult {
  vpsInstances: VPSInstance[];
  dbInstances: DBInstance[];
  orphanInstances: VPSInstance[];
  missingInstances: DBInstance[];
  syncNeeded: boolean;
}

export const WhatsAppDiagnostic = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[WhatsApp Diagnostic] ${message}`);
  };

  const runDiagnostic = async () => {
    setIsRunning(true);
    setLogs([]);
    addLog("🔍 Iniciando diagnóstico completo...");

    try {
      // 1. Buscar instâncias do banco
      addLog("📊 Buscando instâncias do banco de dados...");
      const { data: dbInstances, error: dbError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('connection_type', 'web');

      if (dbError) {
        addLog(`❌ Erro no banco: ${dbError.message}`);
        throw dbError;
      }

      addLog(`✅ Encontradas ${dbInstances?.length || 0} instâncias no banco`);

      // 2. Buscar instâncias do VPS
      addLog("🖥️ Consultando instâncias do VPS...");
      const { data: vpsResponse, error: vpsError } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'list_instances'
        }
      });

      if (vpsError) {
        addLog(`❌ Erro no VPS: ${vpsError.message}`);
        throw vpsError;
      }

      const vpsInstances = vpsResponse?.instances || [];
      addLog(`✅ Encontradas ${vpsInstances.length} instâncias no VPS`);

      // 3. Análise comparativa
      addLog("🔬 Analisando diferenças...");
      
      const orphanInstances = vpsInstances.filter((vps: VPSInstance) => 
        !dbInstances?.some(db => db.vps_instance_id === vps.instanceId)
      );

      const missingInstances = dbInstances?.filter(db => 
        !vpsInstances.some((vps: VPSInstance) => vps.instanceId === db.vps_instance_id)
      ) || [];

      const syncNeeded = orphanInstances.length > 0 || missingInstances.length > 0;

      addLog(`🔍 Instâncias órfãs no VPS: ${orphanInstances.length}`);
      addLog(`🔍 Instâncias faltantes no VPS: ${missingInstances.length}`);
      addLog(`${syncNeeded ? '⚠️' : '✅'} Sincronização ${syncNeeded ? 'necessária' : 'em dia'}`);

      const diagnosticResult: DiagnosticResult = {
        vpsInstances,
        dbInstances: dbInstances || [],
        orphanInstances,
        missingInstances,
        syncNeeded
      };

      setResult(diagnosticResult);
      addLog("🎯 Diagnóstico concluído com sucesso!");

    } catch (error: any) {
      addLog(`💥 Erro no diagnóstico: ${error.message}`);
      toast.error(`Erro no diagnóstico: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const forcedSync = async () => {
    if (!result || !result.syncNeeded) {
      toast.info("Nenhuma sincronização necessária");
      return;
    }

    setIsSyncing(true);
    addLog("🔄 Iniciando sincronização forçada...");

    try {
      const { data: syncResponse, error: syncError } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'sync_instances',
          force: true
        }
      });

      if (syncError) {
        addLog(`❌ Erro na sincronização: ${syncError.message}`);
        throw syncError;
      }

      addLog("✅ Sincronização executada com sucesso!");
      addLog(`📊 Resultado: ${JSON.stringify(syncResponse.summary || {})}`);
      
      toast.success("Sincronização forçada concluída!");
      
      // Re-executar diagnóstico após sync
      setTimeout(() => {
        runDiagnostic();
      }, 2000);

    } catch (error: any) {
      addLog(`💥 Erro na sincronização: ${error.message}`);
      toast.error(`Erro na sincronização: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controles */}
      <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Diagnóstico e Sincronização
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button
              onClick={runDiagnostic}
              disabled={isRunning}
              className="gap-2"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              {isRunning ? "Executando..." : "Executar Diagnóstico"}
            </Button>

            {result?.syncNeeded && (
              <Button
                onClick={forcedSync}
                disabled={isSyncing}
                variant="destructive"
                className="gap-2"
              >
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
                {isSyncing ? "Sincronizando..." : "Forçar Sincronização"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {result && (
        <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-500" />
              Resultados do Diagnóstico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Geral */}
            <div className="flex items-center justify-between p-4 bg-white/20 rounded-lg">
              <span className="font-medium">Status da Sincronização</span>
              <Badge variant={result.syncNeeded ? "destructive" : "default"} className="gap-1">
                {result.syncNeeded ? (
                  <XCircle className="h-3 w-3" />
                ) : (
                  <CheckCircle className="h-3 w-3" />
                )}
                {result.syncNeeded ? "Dessincronizado" : "Sincronizado"}
              </Badge>
            </div>

            <Separator />

            {/* Instâncias do VPS */}
            <div>
              <h4 className="font-semibold mb-2">Instâncias no VPS ({result.vpsInstances.length})</h4>
              <div className="space-y-2">
                {result.vpsInstances.map((instance, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                    <div>
                      <span className="font-medium">{instance.instanceId}</span>
                      {instance.profileName && (
                        <span className="text-sm text-gray-600 ml-2">({instance.profileName})</span>
                      )}
                    </div>
                    <Badge variant={instance.status === 'open' ? 'default' : 'secondary'}>
                      {instance.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Instâncias do Banco */}
            <div>
              <h4 className="font-semibold mb-2">Instâncias no Banco ({result.dbInstances.length})</h4>
              <div className="space-y-2">
                {result.dbInstances.map((instance) => (
                  <div key={instance.id} className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                    <div>
                      <span className="font-medium">{instance.instance_name}</span>
                      <span className="text-sm text-gray-600 ml-2">(VPS: {instance.vps_instance_id})</span>
                    </div>
                    <Badge variant={instance.connection_status === 'open' ? 'default' : 'secondary'}>
                      {instance.connection_status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Problemas Detectados */}
            {(result.orphanInstances.length > 0 || result.missingInstances.length > 0) && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-semibold text-orange-600">Problemas Detectados</h4>
                  
                  {result.orphanInstances.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-red-600 mb-2">
                        Instâncias órfãs no VPS (não estão no banco):
                      </p>
                      {result.orphanInstances.map((instance, index) => (
                        <div key={index} className="p-2 bg-red-50 rounded text-sm">
                          {instance.instanceId} - {instance.status}
                          {instance.profileName && ` (${instance.profileName})`}
                        </div>
                      ))}
                    </div>
                  )}

                  {result.missingInstances.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-yellow-600 mb-2">
                        Instâncias no banco mas não no VPS:
                      </p>
                      {result.missingInstances.map((instance) => (
                        <div key={instance.id} className="p-2 bg-yellow-50 rounded text-sm">
                          {instance.instance_name} (VPS ID: {instance.vps_instance_id})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
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
    </div>
  );
};
