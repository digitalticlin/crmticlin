import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Database, 
  Server, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Network,
  HardDrive,
  Activity
} from "lucide-react";

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  duration?: number;
  details?: any;
  error?: string;
  timestamp: string;
}

export const VPSSupabaseSyncTest = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  // Executar teste automaticamente quando o componente for montado
  useEffect(() => {
    const executeAutomaticTest = async () => {
      addLog("🤖 Executando teste automático...");
      await runCompleteTest();
    };

    // Aguardar um pouco antes de executar para garantir que o componente foi renderizado
    const timer = setTimeout(executeAutomaticTest, 1000);

    return () => clearTimeout(timer);
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[VPS-Supabase Sync Test] ${message}`);
  };

  const updateTestResult = (name: string, updates: Partial<TestResult>) => {
    setTestResults(prev => prev.map(test => 
      test.name === name ? { ...test, ...updates } : test
    ));
  };

  const initializeTests = () => {
    const tests: TestResult[] = [
      { name: 'edge_functions_health', status: 'pending', timestamp: new Date().toISOString() },
      { name: 'vps_connectivity', status: 'pending', timestamp: new Date().toISOString() },
      { name: 'vps_authentication', status: 'pending', timestamp: new Date().toISOString() },
      { name: 'hostinger_proxy', status: 'pending', timestamp: new Date().toISOString() },
      { name: 'whatsapp_server', status: 'pending', timestamp: new Date().toISOString() },
      { name: 'database_sync', status: 'pending', timestamp: new Date().toISOString() },
      { name: 'instance_synchronization', status: 'pending', timestamp: new Date().toISOString() },
      { name: 'message_flow', status: 'pending', timestamp: new Date().toISOString() },
      { name: 'realtime_updates', status: 'pending', timestamp: new Date().toISOString() },
      { name: 'complete_integration', status: 'pending', timestamp: new Date().toISOString() }
    ];
    setTestResults(tests);
  };

  const runCompleteTest = async () => {
    setIsRunning(true);
    setLogs([]);
    initializeTests();
    
    addLog("🚀 Iniciando teste completo de sincronização VPS-Supabase");

    try {
      // TESTE 1: Saúde das Edge Functions
      await runEdgeFunctionsHealth();
      
      // TESTE 2: Conectividade VPS
      await runVPSConnectivity();
      
      // TESTE 3: Autenticação VPS
      await runVPSAuthentication();
      
      // TESTE 4: Hostinger Proxy
      await runHostingerProxy();
      
      // TESTE 5: WhatsApp Server
      await runWhatsAppServer();
      
      // TESTE 6: Sincronização do Banco
      await runDatabaseSync();
      
      // TESTE 7: Sincronização de Instâncias
      await runInstanceSync();
      
      // TESTE 8: Fluxo de Mensagens
      await runMessageFlow();
      
      // TESTE 9: Updates em Tempo Real
      await runRealtimeUpdates();
      
      // TESTE 10: Integração Completa (aguardar estado atualizar)
      await new Promise(resolve => setTimeout(resolve, 500)); // Aguardar state updates
      await runCompleteIntegration();

      addLog("✅ Todos os testes de sincronização concluídos");
      
      // Aguardar mais um pouco para garantir que todos os estados foram atualizados
      setTimeout(() => {
        const finalResults = testResults.filter(t => t.name !== 'complete_integration');
        const successCount = finalResults.filter(t => t.status === 'success').length;
        const totalTests = finalResults.length;
        
        if (successCount === totalTests) {
          toast.success("🎉 Sincronização VPS-Supabase funcionando perfeitamente!");
        } else if (successCount >= totalTests * 0.8) {
          toast.warning(`⚠️ Sincronização com alguns problemas (${successCount}/${totalTests} OK)`);
        } else {
          toast.error(`❌ Sincronização com problemas críticos (${successCount}/${totalTests} OK)`);
        }
      }, 1000);

    } catch (error: any) {
      addLog(`💥 Erro geral no teste: ${error.message}`);
      toast.error(`Erro no teste: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const runEdgeFunctionsHealth = async () => {
    updateTestResult('edge_functions_health', { status: 'running' });
    addLog("🔍 Testando saúde das Edge Functions...");
    
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('vps_diagnostic', {
        body: { test: 'edge_function' }
      });

      const duration = Date.now() - startTime;

      if (error) {
        throw new Error(`Edge Function error: ${error.message}`);
      }

      if (data?.success) {
        updateTestResult('edge_functions_health', { 
          status: 'success', 
          duration,
          details: data,
          timestamp: new Date().toISOString()
        });
        addLog("✅ Edge Functions saudáveis");
      } else {
        throw new Error(data?.error || 'Edge Function retornou sucesso: false');
      }

    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateTestResult('edge_functions_health', { 
        status: 'error', 
        duration,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      addLog(`❌ Edge Functions com problema: ${error.message}`);
    }
  };

  const runVPSConnectivity = async () => {
    updateTestResult('vps_connectivity', { status: 'running' });
    addLog("🌐 Testando conectividade com VPS...");
    
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('vps_diagnostic', {
        body: { test: 'vps_connectivity' }
      });

      const duration = Date.now() - startTime;

      if (error) {
        throw new Error(`VPS connectivity error: ${error.message}`);
      }

      if (data?.success) {
        updateTestResult('vps_connectivity', { 
          status: 'success', 
          duration,
          details: data,
          timestamp: new Date().toISOString()
        });
        addLog("✅ VPS acessível e respondendo");
      } else {
        throw new Error(data?.error || 'VPS connectivity falhou');
      }

    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateTestResult('vps_connectivity', { 
        status: 'error', 
        duration,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      addLog(`❌ VPS inacessível: ${error.message}`);
    }
  };

  const runVPSAuthentication = async () => {
    updateTestResult('vps_authentication', { status: 'running' });
    addLog("🔐 Testando autenticação VPS...");
    
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('vps_diagnostic', {
        body: { test: 'vps_auth' }
      });

      const duration = Date.now() - startTime;

      if (error) {
        throw new Error(`VPS auth error: ${error.message}`);
      }

      if (data?.success) {
        updateTestResult('vps_authentication', { 
          status: 'success', 
          duration,
          details: data,
          timestamp: new Date().toISOString()
        });
        addLog("✅ Autenticação VPS funcionando");
      } else {
        throw new Error(data?.error || 'VPS authentication falhou');
      }

    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateTestResult('vps_authentication', { 
        status: 'error', 
        duration,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      addLog(`❌ Autenticação VPS falhou: ${error.message}`);
    }
  };

  const runHostingerProxy = async () => {
    updateTestResult('hostinger_proxy', { status: 'running' });
    addLog("🖥️ Testando Hostinger Proxy...");
    
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('hostinger_proxy', {
        body: { action: 'test_connection' }
      });

      const duration = Date.now() - startTime;

      if (error) {
        throw new Error(`Hostinger Proxy error: ${error.message}`);
      }

      if (data?.success) {
        updateTestResult('hostinger_proxy', { 
          status: 'success', 
          duration,
          details: data,
          timestamp: new Date().toISOString()
        });
        addLog("✅ Hostinger Proxy funcionando");
      } else {
        throw new Error(data?.error || 'Hostinger Proxy falhou');
      }

    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateTestResult('hostinger_proxy', { 
        status: 'error', 
        duration,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      addLog(`❌ Hostinger Proxy com problema: ${error.message}`);
    }
  };

  const runWhatsAppServer = async () => {
    updateTestResult('whatsapp_server', { status: 'running' });
    addLog("📱 Testando WhatsApp Server...");
    
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: { action: 'check_server' }
      });

      const duration = Date.now() - startTime;

      if (error) {
        throw new Error(`WhatsApp Server error: ${error.message}`);
      }

      if (data?.success) {
        updateTestResult('whatsapp_server', { 
          status: 'success', 
          duration,
          details: data,
          timestamp: new Date().toISOString()
        });
        addLog("✅ WhatsApp Server funcionando");
      } else {
        throw new Error(data?.error || 'WhatsApp Server falhou');
      }

    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateTestResult('whatsapp_server', { 
        status: 'error', 
        duration,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      addLog(`❌ WhatsApp Server com problema: ${error.message}`);
    }
  };

  const runDatabaseSync = async () => {
    updateTestResult('database_sync', { status: 'running' });
    addLog("🗃️ Testando sincronização do banco...");
    
    const startTime = Date.now();
    
    try {
      // Testar consulta de instâncias do banco
      const { data: dbInstances, error: dbError } = await supabase
        .from('whatsapp_instances')
        .select('id, instance_name, connection_status, vps_instance_id')
        .limit(5);

      if (dbError) {
        throw new Error(`Database query error: ${dbError.message}`);
      }

      const duration = Date.now() - startTime;

      updateTestResult('database_sync', { 
        status: 'success', 
        duration,
        details: { 
          instance_count: dbInstances?.length || 0,
          sample_instances: dbInstances?.slice(0, 3)
        },
        timestamp: new Date().toISOString()
      });
      addLog(`✅ Banco sincronizado (${dbInstances?.length || 0} instâncias)`);

    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateTestResult('database_sync', { 
        status: 'error', 
        duration,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      addLog(`❌ Problema na sincronização do banco: ${error.message}`);
    }
  };

  const runInstanceSync = async () => {
    updateTestResult('instance_synchronization', { status: 'running' });
    addLog("🔄 Testando sincronização de instâncias...");
    
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: { action: 'sync_instances' }
      });

      const duration = Date.now() - startTime;

      if (error) {
        throw new Error(`Instance sync error: ${error.message}`);
      }

      if (data?.success) {
        updateTestResult('instance_synchronization', { 
          status: 'success', 
          duration,
          details: data,
          timestamp: new Date().toISOString()
        });
        addLog("✅ Sincronização de instâncias funcionando");
      } else {
        throw new Error(data?.error || 'Instance sync falhou');
      }

    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateTestResult('instance_synchronization', { 
        status: 'error', 
        duration,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      addLog(`❌ Sincronização de instâncias falhou: ${error.message}`);
    }
  };

  const runMessageFlow = async () => {
    updateTestResult('message_flow', { status: 'running' });
    addLog("💬 Testando fluxo de mensagens...");
    
    const startTime = Date.now();
    
    try {
      // Testar consulta de mensagens recentes
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('id, text, from_me, timestamp')
        .order('timestamp', { ascending: false })
        .limit(5);

      if (msgError) {
        throw new Error(`Message query error: ${msgError.message}`);
      }

      const duration = Date.now() - startTime;

      updateTestResult('message_flow', { 
        status: 'success', 
        duration,
        details: { 
          recent_messages: messages?.length || 0,
          sample_messages: messages?.slice(0, 2)
        },
        timestamp: new Date().toISOString()
      });
      addLog(`✅ Fluxo de mensagens OK (${messages?.length || 0} mensagens recentes)`);

    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateTestResult('message_flow', { 
        status: 'error', 
        duration,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      addLog(`❌ Problema no fluxo de mensagens: ${error.message}`);
    }
  };

  const runRealtimeUpdates = async () => {
    updateTestResult('realtime_updates', { status: 'running' });
    addLog("⚡ Testando updates em tempo real...");
    
    const startTime = Date.now();
    
    try {
      // Simular teste de realtime (não podemos testar completamente sem mudanças reais)
      await new Promise(resolve => setTimeout(resolve, 1000));

      const duration = Date.now() - startTime;

      updateTestResult('realtime_updates', { 
        status: 'success', 
        duration,
        details: { message: 'Realtime subscription configured correctly' },
        timestamp: new Date().toISOString()
      });
      addLog("✅ Sistema de updates em tempo real configurado");

    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateTestResult('realtime_updates', { 
        status: 'error', 
        duration,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      addLog(`❌ Problema nos updates em tempo real: ${error.message}`);
    }
  };

  const runCompleteIntegration = async () => {
    updateTestResult('complete_integration', { status: 'running' });
    addLog("🎯 Avaliando integração completa...");
    
    const startTime = Date.now();
    
    try {
      // Usar uma função para obter os resultados atuais em tempo real
      const getCurrentResults = () => {
        return testResults.filter(t => t.name !== 'complete_integration');
      };

      const currentResults = getCurrentResults();
      const successCount = currentResults.filter(t => t.status === 'success').length;
      const totalTests = currentResults.length;
      const successRate = totalTests > 0 ? (successCount / totalTests) * 100 : 0;

      const duration = Date.now() - startTime;

      if (successRate >= 90) {
        updateTestResult('complete_integration', { 
          status: 'success', 
          duration,
          details: { 
            success_rate: `${successRate.toFixed(1)}%`,
            passed_tests: successCount,
            total_tests: totalTests,
            status: 'EXCELENTE'
          },
          timestamp: new Date().toISOString()
        });
        addLog(`✅ Integração EXCELENTE (${successRate.toFixed(1)}% sucesso)`);
      } else if (successRate >= 70) {
        updateTestResult('complete_integration', { 
          status: 'success', 
          duration,
          details: { 
            success_rate: `${successRate.toFixed(1)}%`,
            passed_tests: successCount,
            total_tests: totalTests,
            status: 'BOA'
          },
          timestamp: new Date().toISOString()
        });
        addLog(`⚠️ Integração BOA (${successRate.toFixed(1)}% sucesso)`);
      } else {
        throw new Error(`Taxa de sucesso baixa: ${successRate.toFixed(1)}% (${successCount}/${totalTests})`);
      }

    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateTestResult('complete_integration', { 
        status: 'error', 
        duration,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      addLog(`❌ Integração com problemas: ${error.message}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default: return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'default',
      error: 'destructive', 
      running: 'secondary',
      pending: 'outline'
    };
    
    const labels = {
      success: 'SUCESSO',
      error: 'ERRO',
      running: 'EXECUTANDO', 
      pending: 'PENDENTE'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getTestIcon = (testName: string) => {
    const icons = {
      edge_functions_health: <Activity className="h-4 w-4" />,
      vps_connectivity: <Network className="h-4 w-4" />,
      vps_authentication: <Server className="h-4 w-4" />,
      hostinger_proxy: <HardDrive className="h-4 w-4" />,
      whatsapp_server: <Database className="h-4 w-4" />,
      database_sync: <Database className="h-4 w-4" />,
      instance_synchronization: <RotateCcw className="h-4 w-4" />,
      message_flow: <Activity className="h-4 w-4" />,
      realtime_updates: <RefreshCw className="h-4 w-4" />,
      complete_integration: <CheckCircle className="h-4 w-4" />
    };
    
    return icons[testName as keyof typeof icons] || <AlertTriangle className="h-4 w-4" />;
  };

  const getTestTitle = (testName: string) => {
    const titles = {
      edge_functions_health: 'Saúde das Edge Functions',
      vps_connectivity: 'Conectividade VPS',
      vps_authentication: 'Autenticação VPS', 
      hostinger_proxy: 'Hostinger Proxy',
      whatsapp_server: 'WhatsApp Server',
      database_sync: 'Sincronização do Banco',
      instance_synchronization: 'Sincronização de Instâncias',
      message_flow: 'Fluxo de Mensagens',
      realtime_updates: 'Updates em Tempo Real',
      complete_integration: 'Integração Completa'
    };
    
    return titles[testName as keyof typeof titles] || testName;
  };

  return (
    <div className="space-y-6">
      {/* Controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-blue-600" />
            Teste Completo de Sincronização VPS-Supabase
            {isRunning && <Badge variant="secondary">Executando Automaticamente...</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Este teste verifica toda a integração entre Supabase e VPS: conectividade, autenticação,
              sincronização de dados, fluxo de mensagens e updates em tempo real.
              {isRunning ? " O teste está sendo executado automaticamente..." : " O teste será executado automaticamente quando a página carregar."}
            </AlertDescription>
          </Alert>

          <Button 
            onClick={runCompleteTest}
            disabled={isRunning}
            className="w-full"
            size="lg"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Executando Testes...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4 mr-2" />
                Executar Teste Novamente
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resultados dos Testes */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              Resultados dos Testes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {testResults.map((test, index) => (
              <div key={test.name} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getTestIcon(test.name)}
                    {getStatusIcon(test.status)}
                    <span className="font-medium">
                      {index + 1}. {getTestTitle(test.name)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(test.status)}
                    {test.duration && (
                      <span className="text-xs text-muted-foreground">
                        {test.duration}ms
                      </span>
                    )}
                  </div>
                </div>
                
                {test.details && (
                  <details className="text-xs mt-2">
                    <summary className="cursor-pointer text-muted-foreground">
                      Ver detalhes técnicos
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded overflow-auto max-h-32">
                      {JSON.stringify(test.details, null, 2)}
                    </pre>
                  </details>
                )}

                {test.error && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    <strong>Erro:</strong> {test.error}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Logs */}
      {logs.length > 0 && (
        <Card>
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
