
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  TestTube, 
  MessageSquare, 
  QrCode, 
  Download,
  Activity,
  Settings,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Users,
  Database
} from "lucide-react";

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  duration?: number;
}

export const ModularTestPanel = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [activeTest, setActiveTest] = useState<string>('');

  const testModules = [
    {
      id: 'instance_manager',
      name: 'Instance Manager',
      icon: Settings,
      description: 'Criação, exclusão e sincronização de instâncias',
      color: 'blue'
    },
    {
      id: 'qr_service',
      name: 'QR Service',
      icon: QrCode,
      description: 'Geração e verificação de QR Codes',
      color: 'purple'
    },
    {
      id: 'messaging_service',
      name: 'Messaging Service',
      icon: MessageSquare,
      description: 'Envio e recebimento de mensagens',
      color: 'green'
    },
    {
      id: 'chat_import',
      name: 'Chat Import',
      icon: Download,
      description: 'Importação de conversas e contatos',
      color: 'orange'
    },
    {
      id: 'diagnostic_service',
      name: 'Diagnostic Service',
      icon: Activity,
      description: 'Diagnósticos e testes de conectividade',
      color: 'red'
    }
  ];

  const testInstanceManager = async () => {
    setActiveTest('instance_manager');
    console.log('[Modular Test] 🧪 Testando Instance Manager...');
    
    try {
      // Teste 1: Listar instâncias
      const { data: listData, error: listError } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: { action: 'list_instances' }
      });

      if (listError) throw listError;
      if (!listData.success) throw new Error(listData.error);

      // Teste 2: Sincronizar instâncias
      const { data: syncData, error: syncError } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: { action: 'sync_instances' }
      });

      if (syncError) throw syncError;
      if (!syncData.success) throw new Error(syncData.error);

      return {
        success: true,
        message: `✅ Instance Manager funcionando! ${listData.instances?.length || 0} instâncias encontradas`,
        data: {
          instances: listData.instances?.length || 0,
          syncResult: syncData.summary
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: '❌ Instance Manager com problemas',
        error: error.message
      };
    }
  };

  const testQRService = async () => {
    setActiveTest('qr_service');
    console.log('[Modular Test] 📱 Testando QR Service...');
    
    try {
      // Buscar uma instância existente para testar
      const { data: listData } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: { action: 'list_instances' }
      });

      if (!listData.success || !listData.instances || listData.instances.length === 0) {
        return {
          success: false,
          message: '⚠️ Nenhuma instância disponível para testar QR Service',
          error: 'No instances found'
        };
      }

      const testInstance = listData.instances[0];

      // Testar verificação de status
      const { data: statusData, error: statusError } = await supabase.functions.invoke('whatsapp_qr_service', {
        body: { 
          action: 'check_status',
          instanceId: testInstance.id
        }
      });

      if (statusError) throw statusError;

      return {
        success: true,
        message: `✅ QR Service funcionando! Status da instância: ${statusData.status || 'unknown'}`,
        data: {
          instanceTested: testInstance.instance_name,
          connected: statusData.connected,
          status: statusData.status
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: '❌ QR Service com problemas',
        error: error.message
      };
    }
  };

  const testMessagingService = async () => {
    setActiveTest('messaging_service');
    console.log('[Modular Test] 💬 Testando Messaging Service...');
    
    try {
      // Buscar uma instância conectada para testar
      const { data: listData } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: { action: 'list_instances' }
      });

      if (!listData.success || !listData.instances || listData.instances.length === 0) {
        return {
          success: false,
          message: '⚠️ Nenhuma instância disponível para testar Messaging Service',
          error: 'No instances found'
        };
      }

      const testInstance = listData.instances[0];

      // Simular webhook (teste de processamento)
      const { data: webhookData, error: webhookError } = await supabase.functions.invoke('whatsapp_messaging_service', {
        body: {
          instanceId: testInstance.vps_instance_id,
          event: 'test',
          messages: [{
            id: 'test_message_' + Date.now(),
            from: '5511999999999@c.us',
            body: 'Mensagem de teste do sistema',
            fromMe: false,
            timestamp: new Date().toISOString()
          }]
        },
        headers: { 'x-webhook': 'true' }
      });

      if (webhookError) throw webhookError;

      return {
        success: true,
        message: `✅ Messaging Service funcionando! Webhook processado`,
        data: {
          instanceTested: testInstance.instance_name,
          webhookProcessed: webhookData.success,
          messagesProcessed: webhookData.processed || 0
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: '❌ Messaging Service com problemas',
        error: error.message
      };
    }
  };

  const testChatImport = async () => {
    setActiveTest('chat_import');
    console.log('[Modular Test] 📥 Testando Chat Import...');
    
    try {
      // Buscar uma instância para testar status de importação
      const { data: listData } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: { action: 'list_instances' }
      });

      if (!listData.success || !listData.instances || listData.instances.length === 0) {
        return {
          success: false,
          message: '⚠️ Nenhuma instância disponível para testar Chat Import',
          error: 'No instances found'
        };
      }

      const testInstance = listData.instances[0];

      // Testar status de importação
      const { data: importData, error: importError } = await supabase.functions.invoke('whatsapp_chat_import', {
        body: { 
          action: 'get_import_status',
          instanceId: testInstance.id
        }
      });

      if (importError) throw importError;
      if (!importData.success) throw new Error(importData.error);

      return {
        success: true,
        message: `✅ Chat Import funcionando! Status obtido`,
        data: {
          instanceTested: testInstance.instance_name,
          importStatus: importData.status,
          contactsImported: importData.status?.contactsImported || 0,
          messagesImported: importData.status?.messagesImported || 0
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: '❌ Chat Import com problemas',
        error: error.message
      };
    }
  };

  const testDiagnosticService = async () => {
    setActiveTest('diagnostic_service');
    console.log('[Modular Test] 🔍 Testando Diagnostic Service...');
    
    try {
      // Teste diagnóstico rápido
      const { data: diagData, error: diagError } = await supabase.functions.invoke('whatsapp_diagnostic_service', {
        body: { action: 'quick_diagnostic' }
      });

      if (diagError) throw diagError;
      if (!diagData.success) throw new Error(diagData.error);

      return {
        success: true,
        message: `✅ Diagnostic Service funcionando! ${diagData.summary.successfulTests}/${diagData.summary.totalTests} testes passaram`,
        data: {
          testsRun: diagData.summary.totalTests,
          testsSuccess: diagData.summary.successfulTests,
          successRate: diagData.summary.successRate
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: '❌ Diagnostic Service com problemas',
        error: error.message
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults({});
    
    toast.info("🧪 Iniciando testes dos 5 módulos...");

    const testFunctions = [
      { id: 'instance_manager', fn: testInstanceManager },
      { id: 'qr_service', fn: testQRService },
      { id: 'messaging_service', fn: testMessagingService },
      { id: 'chat_import', fn: testChatImport },
      { id: 'diagnostic_service', fn: testDiagnosticService }
    ];

    const newResults: Record<string, TestResult> = {};

    for (const test of testFunctions) {
      try {
        const startTime = Date.now();
        const result = await test.fn();
        const duration = Date.now() - startTime;
        
        newResults[test.id] = { ...result, duration };
        setResults({ ...newResults });
        
        if (result.success) {
          toast.success(result.message);
        } else {
          toast.error(result.message);
        }
      } catch (error: any) {
        newResults[test.id] = {
          success: false,
          message: `❌ Erro no teste ${test.id}`,
          error: error.message,
          duration: 0
        };
        setResults({ ...newResults });
        toast.error(`Erro no ${test.id}: ${error.message}`);
      }
    }

    setActiveTest('');
    setIsRunning(false);

    const totalTests = Object.keys(newResults).length;
    const successfulTests = Object.values(newResults).filter(r => r.success).length;
    
    if (successfulTests === totalTests) {
      toast.success(`🎉 Todos os ${totalTests} módulos funcionando perfeitamente!`);
    } else {
      toast.warning(`⚠️ ${successfulTests}/${totalTests} módulos funcionando. Verificar falhas.`);
    }
  };

  const runSingleTest = async (moduleId: string) => {
    const testMap = {
      'instance_manager': testInstanceManager,
      'qr_service': testQRService,
      'messaging_service': testMessagingService,
      'chat_import': testChatImport,
      'diagnostic_service': testDiagnosticService
    };

    const testFn = testMap[moduleId as keyof typeof testMap];
    if (!testFn) return;

    setIsRunning(true);
    
    try {
      const startTime = Date.now();
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      setResults(prev => ({
        ...prev,
        [moduleId]: { ...result, duration }
      }));
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        [moduleId]: {
          success: false,
          message: `❌ Erro no teste`,
          error: error.message,
          duration: 0
        }
      }));
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsRunning(false);
      setActiveTest('');
    }
  };

  const getStatusIcon = (moduleId: string) => {
    const result = results[moduleId];
    if (!result) return null;
    
    return result.success ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getModuleColor = (color: string) => {
    const colors = {
      blue: 'border-blue-200 bg-blue-50',
      purple: 'border-purple-200 bg-purple-50',
      green: 'border-green-200 bg-green-50',
      orange: 'border-orange-200 bg-orange-50',
      red: 'border-red-200 bg-red-50'
    };
    return colors[color as keyof typeof colors] || 'border-gray-200 bg-gray-50';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <TestTube className="h-5 w-5" />
            Painel de Testes Modulares - Arquitetura V2.0
          </CardTitle>
          <p className="text-green-700 text-sm">
            Teste completo das 5 Edge Functions modulares do sistema WhatsApp CRM
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              onClick={runAllTests}
              disabled={isRunning}
              size="lg"
              className="bg-green-600 hover:bg-green-700"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Testando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Testar Todos os Módulos
                </>
              )}
            </Button>
            
            {Object.keys(results).length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {Object.values(results).filter(r => r.success).length}/{Object.keys(results).length} Sucessos
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Módulos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {testModules.map((module) => {
          const Icon = module.icon;
          const result = results[module.id];
          const isActive = activeTest === module.id;
          
          return (
            <Card key={module.id} className={`${getModuleColor(module.color)} transition-all duration-200 ${isActive ? 'ring-2 ring-blue-400' : ''}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {module.name}
                  </div>
                  {getStatusIcon(module.id)}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {module.description}
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {result && (
                    <div className="text-xs">
                      <div className={`p-2 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {result.message}
                      </div>
                      {result.duration && (
                        <div className="text-muted-foreground mt-1">
                          Executado em {result.duration}ms
                        </div>
                      )}
                      {result.data && (
                        <div className="text-muted-foreground mt-1">
                          {JSON.stringify(result.data, null, 2).substring(0, 100)}...
                        </div>
                      )}
                    </div>
                  )}
                  
                  <Button
                    onClick={() => runSingleTest(module.id)}
                    disabled={isRunning}
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    {isActive ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        Testando...
                      </>
                    ) : (
                      <>
                        <TestTube className="h-3 w-3 mr-1" />
                        Testar
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Resultados Detalhados */}
      {Object.keys(results).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Resultados Detalhados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="summary">Resumo</TabsTrigger>
                <TabsTrigger value="details">Detalhes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Object.values(results).filter(r => r.success).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Sucessos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {Object.values(results).filter(r => !r.success).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Falhas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {Object.keys(results).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round((Object.values(results).filter(r => r.success).length / Object.keys(results).length) * 100)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Taxa Sucesso</div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="details" className="space-y-4">
                {Object.entries(results).map(([moduleId, result]) => {
                  const module = testModules.find(m => m.id === moduleId);
                  return (
                    <div key={moduleId} className={`border rounded-lg p-4 ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {module && <module.icon className="h-4 w-4" />}
                          <span className="font-medium">{module?.name || moduleId}</span>
                        </div>
                        <Badge variant={result.success ? "default" : "destructive"}>
                          {result.success ? "SUCESSO" : "FALHA"}
                        </Badge>
                      </div>
                      <div className="text-sm">
                        <div className="mb-2">{result.message}</div>
                        {result.duration && (
                          <div className="text-muted-foreground">
                            Duração: {result.duration}ms
                          </div>
                        )}
                        {result.error && (
                          <div className="text-red-600 text-xs bg-red-100 p-2 rounded mt-2">
                            Erro: {result.error}
                          </div>
                        )}
                        {result.data && (
                          <div className="text-muted-foreground text-xs bg-gray-100 p-2 rounded mt-2">
                            <pre>{JSON.stringify(result.data, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
