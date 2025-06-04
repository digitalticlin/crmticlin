
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, PlayCircle, RefreshCw, Server, Database, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TestResult {
  success: boolean;
  message: string;
  details: string;
  duration: number;
}

interface SyncResult {
  success: boolean;
  syncId?: string;
  summary?: {
    updated: number;
    preserved: number;
    adopted: number;
    errors: number;
    total_vps_instances: number;
    total_db_instances: number;
    vps_healthy: boolean;
    performance: {
      totalDuration: string;
      dbDuration: string;
      vpsDuration: string;
    };
  };
  error?: string;
}

interface InstanceData {
  id: string;
  instance_name: string;
  phone: string;
  connection_status: string;
  web_status: string;
  vps_instance_id: string;
  created_at: string;
}

export const SimpleVPSDiagnostic = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [instances, setInstances] = useState<InstanceData[]>([]);
  const [isAutoExecuting, setIsAutoExecuting] = useState(true);

  // Execução automática quando o componente carrega
  useEffect(() => {
    executeAutoSync();
  }, []);

  const executeAutoSync = async () => {
    console.log('[Auto Sync] 🚀 Iniciando sincronização automática...');
    
    setIsAutoExecuting(true);
    setResult(null);
    setSyncResult(null);
    
    const startTime = Date.now();
    
    try {
      // 1. Primeiro, testar conexão VPS
      console.log('[Auto Sync] 📡 Testando conexão VPS...');
      
      const { data: healthData, error: healthError } = await supabase.functions.invoke('whatsapp_web_server', {
        body: { action: 'check_server' }
      });

      const healthDuration = Date.now() - startTime;

      if (healthError) {
        console.error('[Auto Sync] ❌ Erro na conexão VPS:', healthError);
        setResult({
          success: false,
          message: "Falha na conexão com VPS",
          details: `Erro: ${healthError.message}`,
          duration: healthDuration
        });
        return;
      }

      console.log('[Auto Sync] ✅ VPS conectado:', healthData);
      setResult({
        success: true,
        message: "VPS conectado e funcionando",
        details: `Status: ${healthData?.status || 'OK'}. Instâncias ativas: ${healthData?.active_instances || 0}`,
        duration: healthDuration
      });

      // 2. Executar sincronização das instâncias
      console.log('[Auto Sync] 🔄 Executando sincronização de instâncias...');
      
      const syncStartTime = Date.now();
      const { data: syncData, error: syncError } = await supabase.functions.invoke('whatsapp_web_server', {
        body: { action: 'sync_instances' }
      });

      const syncDuration = Date.now() - syncStartTime;

      if (syncError) {
        console.error('[Auto Sync] ❌ Erro na sincronização:', syncError);
        setSyncResult({
          success: false,
          error: syncError.message
        });
      } else {
        console.log('[Auto Sync] ✅ Sincronização concluída:', syncData);
        setSyncResult(syncData);
      }

      // 3. Buscar instâncias atualizadas do banco
      await fetchInstances();

    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error('[Auto Sync] 💥 Erro geral:', error);
      setResult({
        success: false,
        message: "Erro inesperado na execução automática",
        details: `Exceção: ${error.message}`,
        duration
      });
    } finally {
      setIsAutoExecuting(false);
    }
  };

  const fetchInstances = async () => {
    try {
      console.log('[Auto Sync] 📊 Buscando instâncias do banco...');
      
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('id, instance_name, phone, connection_status, web_status, vps_instance_id, created_at')
        .eq('connection_type', 'web')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Auto Sync] ❌ Erro ao buscar instâncias:', error);
        return;
      }

      console.log(`[Auto Sync] 📊 Encontradas ${data?.length || 0} instâncias no banco`);
      setInstances(data || []);
    } catch (error) {
      console.error('[Auto Sync] ❌ Erro ao buscar instâncias:', error);
    }
  };

  const executeVPSTest = async () => {
    setIsExecuting(true);
    setResult(null);
    
    const startTime = Date.now();
    
    try {
      console.log('[Manual Test] 🔄 Teste manual iniciado...');
      
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: { action: 'check_server' }
      });

      const duration = Date.now() - startTime;

      if (error) {
        console.error('[Manual Test] ❌ Erro:', error);
        setResult({
          success: false,
          message: "Falha na conexão com VPS",
          details: `Erro: ${error.message}`,
          duration
        });
        return;
      }

      console.log('[Manual Test] ✅ Sucesso:', data);
      setResult({
        success: true,
        message: "VPS conectada e funcionando",
        details: `Servidor WhatsApp Web.js operacional. Status: ${data?.status || 'OK'}`,
        duration
      });

    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error('[Manual Test] ❌ Exceção:', error);
      setResult({
        success: false,
        message: "Erro inesperado",
        details: `Exceção: ${error.message}`,
        duration
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status da Execução Automática */}
      {isAutoExecuting && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-blue-700 font-medium">Executando sincronização automática...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teste de Conexão VPS */}
      <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-500" />
            Teste de Conexão VPS
          </CardTitle>
          <p className="text-muted-foreground">
            Teste da conexão com o servidor VPS WhatsApp Web.js
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={executeVPSTest}
            disabled={isExecuting || isAutoExecuting}
            size="lg"
            className="w-full"
          >
            {isExecuting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Testando Conexão...
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4 mr-2" />
                Testar Conexão VPS (Manual)
              </>
            )}
          </Button>

          {result && (
            <Card className={`border ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-medium">{result.message}</span>
                  </div>
                  <Badge variant={result.success ? "default" : "destructive"}>
                    {result.success ? "Sucesso" : "Falha"}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{result.details}</p>
                <p className="text-xs text-gray-500">Duração: {result.duration}ms</p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Resultado da Sincronização */}
      {syncResult && (
        <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-500" />
              Resultado da Sincronização
            </CardTitle>
            <p className="text-muted-foreground">
              Sincronização automática entre VPS e banco de dados
            </p>
          </CardHeader>
          <CardContent>
            {syncResult.success ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-green-700">Sincronização concluída com sucesso</span>
                  {syncResult.syncId && (
                    <Badge variant="outline" className="text-xs">
                      ID: {syncResult.syncId}
                    </Badge>
                  )}
                </div>
                
                {syncResult.summary && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{syncResult.summary.adopted}</div>
                      <div className="text-sm text-blue-800">Adotadas</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{syncResult.summary.updated}</div>
                      <div className="text-sm text-green-800">Atualizadas</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-gray-600">{syncResult.summary.preserved}</div>
                      <div className="text-sm text-gray-800">Preservadas</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{syncResult.summary.errors}</div>
                      <div className="text-sm text-red-800">Erros</div>
                    </div>
                  </div>
                )}

                {syncResult.summary?.performance && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Performance</h4>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>Total: {syncResult.summary.performance.totalDuration}</div>
                      <div>DB: {syncResult.summary.performance.dbDuration}</div>
                      <div>VPS: {syncResult.summary.performance.vpsDuration}</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="font-medium text-red-700">Erro na sincronização</span>
                <span className="text-sm text-red-600">- {syncResult.error}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabela de Instâncias */}
      <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-green-500" />
            Instâncias WhatsApp ({instances.length})
          </CardTitle>
          <p className="text-muted-foreground">
            Instâncias sincronizadas no banco de dados
          </p>
        </CardHeader>
        <CardContent>
          {instances.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Nome da Instância</th>
                    <th className="text-left p-2">Telefone</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">VPS ID</th>
                    <th className="text-left p-2">Criado</th>
                  </tr>
                </thead>
                <tbody>
                  {instances.map((instance) => (
                    <tr key={instance.id} className="border-b">
                      <td className="p-2 font-medium">{instance.instance_name}</td>
                      <td className="p-2">{instance.phone || 'N/A'}</td>
                      <td className="p-2">
                        <Badge 
                          variant={instance.connection_status === 'ready' ? 'default' : 'secondary'}
                          className={
                            instance.connection_status === 'ready' ? 'bg-green-100 text-green-800' :
                            instance.connection_status === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }
                        >
                          {instance.connection_status}
                        </Badge>
                      </td>
                      <td className="p-2 font-mono text-xs">{instance.vps_instance_id}</td>
                      <td className="p-2 text-xs">
                        {new Date(instance.created_at).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma instância encontrada no banco de dados</p>
              <p className="text-sm">A sincronização pode ter encontrado 0 instâncias ativas na VPS</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
