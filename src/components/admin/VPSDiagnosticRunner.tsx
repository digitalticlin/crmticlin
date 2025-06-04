
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Clock, AlertTriangle, PlayCircle, RefreshCw, Server, Network, Zap } from "lucide-react";

interface TestResult {
  functionName: string;
  success: boolean;
  duration: number;
  statusCode?: number;
  response?: any;
  error?: string;
  timestamp: string;
  details: any;
}

interface ComprehensiveDiagnosticResult {
  totalTests: number;
  successCount: number;
  failureCount: number;
  totalDuration: number;
  results: TestResult[];
  summary: {
    edgeFunctions: 'healthy' | 'partial' | 'critical';
    vpsConnectivity: 'healthy' | 'degraded' | 'critical';
    authentication: 'healthy' | 'critical';
  };
  recommendations: string[];
}

export const VPSDiagnosticRunner = () => {
  const [diagnostic, setDiagnostic] = useState<ComprehensiveDiagnosticResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState<string>('');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev, logMessage]);
    console.log(`[VPS Diagnostic Runner] ${message}`);
  };

  const edgeFunctionTests = [
    {
      name: "vps_diagnostic_connectivity",
      description: "Teste de conectividade VPS",
      endpoint: "vps_diagnostic",
      payload: { test: "vps_connectivity" }
    },
    {
      name: "vps_diagnostic_auth",
      description: "Teste de autenticação VPS",
      endpoint: "vps_diagnostic", 
      payload: { test: "vps_auth" }
    },
    {
      name: "vps_diagnostic_services",
      description: "Teste de serviços VPS",
      endpoint: "vps_diagnostic",
      payload: { test: "vps_services" }
    },
    {
      name: "vps_diagnostic_full_flow",
      description: "Teste de fluxo completo (CORRIGIDO)",
      endpoint: "vps_diagnostic",
      payload: { test: "full_flow", vpsAction: "check_server" }
    },
    {
      name: "whatsapp_web_server_health",
      description: "Health check direto do servidor WhatsApp",
      endpoint: "whatsapp_web_server",
      payload: { action: "check_server" }
    },
    {
      name: "whatsapp_web_server_instances",
      description: "Listar instâncias WhatsApp",
      endpoint: "whatsapp_web_server",
      payload: { action: "list_instances" }
    }
  ];

  const executeTest = async (test: any): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      addLog(`🧪 Testando: ${test.description}`);
      setCurrentTest(test.description);

      const { data, error } = await supabase.functions.invoke(test.endpoint, {
        body: test.payload
      });

      const duration = Date.now() - startTime;

      if (error) {
        addLog(`❌ ERRO em ${test.name}: ${error.message}`);
        return {
          functionName: test.name,
          success: false,
          duration,
          error: error.message,
          timestamp: new Date().toISOString(),
          details: { error, payload: test.payload }
        };
      }

      addLog(`✅ SUCESSO em ${test.name} (${duration}ms)`);
      return {
        functionName: test.name,
        success: true,
        duration,
        response: data,
        timestamp: new Date().toISOString(),
        details: { response: data, payload: test.payload }
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      addLog(`💥 EXCEÇÃO em ${test.name}: ${error.message}`);
      
      return {
        functionName: test.name,
        success: false,
        duration,
        error: error.message,
        timestamp: new Date().toISOString(),
        details: { error: error.message, payload: test.payload }
      };
    }
  };

  const analyzeDiagnosticResults = (results: TestResult[]): ComprehensiveDiagnosticResult['summary'] => {
    const totalTests = results.length;
    const successCount = results.filter(r => r.success).length;
    
    const edgeFunctionsHealth = successCount === totalTests ? 'healthy' : 
                              successCount > totalTests * 0.5 ? 'partial' : 'critical';
    
    const vpsConnectivityTests = results.filter(r => 
      r.functionName.includes('connectivity') || 
      r.functionName.includes('health') ||
      r.functionName.includes('services')
    );
    const vpsSuccessCount = vpsConnectivityTests.filter(r => r.success).length;
    const vpsConnectivity = vpsSuccessCount === vpsConnectivityTests.length ? 'healthy' :
                           vpsSuccessCount > 0 ? 'degraded' : 'critical';
    
    const authTests = results.filter(r => 
      r.functionName.includes('auth') || 
      r.functionName.includes('full_flow')
    );
    const authSuccessCount = authTests.filter(r => r.success).length;
    const authentication = authSuccessCount === authTests.length ? 'healthy' : 'critical';

    return {
      edgeFunctions: edgeFunctionsHealth,
      vpsConnectivity,
      authentication
    };
  };

  const generateRecommendations = (results: TestResult[], summary: any): string[] => {
    const recommendations: string[] = [];

    if (summary.authentication === 'critical') {
      recommendations.push('🔐 CRÍTICO: Verificar configuração de autenticação entre Edge Functions');
      recommendations.push('🔐 Verificar se os tokens estão sendo passados corretamente');
    }

    if (summary.vpsConnectivity === 'critical') {
      recommendations.push('🌐 CRÍTICO: VPS inacessível - verificar se servidor está online');
      recommendations.push('🌐 Verificar configuração de rede e firewall da VPS');
    } else if (summary.vpsConnectivity === 'degraded') {
      recommendations.push('⚠️ VPS com problemas intermitentes - monitorar estabilidade');
    }

    if (summary.edgeFunctions === 'partial') {
      recommendations.push('⚙️ Algumas Edge Functions falhando - verificar logs específicos');
    } else if (summary.edgeFunctions === 'critical') {
      recommendations.push('🚨 CRÍTICO: Múltiplas Edge Functions falhando - verificar configuração geral');
    }

    const failedTests = results.filter(r => !r.success);
    if (failedTests.length > 0) {
      recommendations.push(`📊 Testes falharam: ${failedTests.map(t => t.functionName).join(', ')}`);
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Sistema funcionando normalmente - nenhuma ação necessária');
    }

    return recommendations;
  };

  const executeComprehensiveDiagnostic = async () => {
    setIsExecuting(true);
    setDiagnostic(null);
    setLogs([]);
    setProgress(0);
    setCurrentTest('');

    try {
      addLog("🚀 INICIANDO DIAGNÓSTICO COMPLETÍSSIMO DE TODAS AS EDGE FUNCTIONS VPS");
      setProgress(5);

      const results: TestResult[] = [];
      const totalTests = edgeFunctionTests.length;

      for (let i = 0; i < totalTests; i++) {
        const test = edgeFunctionTests[i];
        const result = await executeTest(test);
        results.push(result);
        
        const progressPercent = Math.round(((i + 1) / totalTests) * 85) + 10;
        setProgress(progressPercent);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setProgress(95);
      addLog("📊 Analisando resultados...");

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

      const summary = analyzeDiagnosticResults(results);
      const recommendations = generateRecommendations(results, summary);

      const comprehensiveDiagnostic: ComprehensiveDiagnosticResult = {
        totalTests,
        successCount,
        failureCount,
        totalDuration,
        results,
        summary,
        recommendations
      };

      setDiagnostic(comprehensiveDiagnostic);
      setProgress(100);

      addLog(`✅ DIAGNÓSTICO CONCLUÍDO!`);
      addLog(`📊 RESULTADO: ${successCount}/${totalTests} testes passaram`);
      addLog(`⏱️ Duração total: ${totalDuration}ms`);

      // Log detalhado no console para o chat
      console.log("=== DIAGNÓSTICO COMPLETÍSSIMO VPS ===");
      console.log("Status Geral:", summary.edgeFunctions);
      console.log("Sucessos:", successCount);
      console.log("Falhas:", failureCount);
      console.log("Duração Total:", totalDuration + "ms");
      console.log("Análise por Componente:", summary);
      console.log("Recomendações:", recommendations);
      console.log("Detalhes dos Testes:");
      results.forEach((test, index) => {
        console.log(`${index + 1}. ${test.functionName}: ${test.success ? 'SUCESSO' : 'FALHA'} (${test.duration}ms)`);
        if (!test.success && test.error) {
          console.log(`   Erro: ${test.error}`);
        }
      });
      console.log("=====================================");

    } catch (error: any) {
      addLog(`❌ ERRO FATAL: ${error.message}`);
      console.error('[VPS Diagnostic Runner] Fatal Error:', error);
    } finally {
      setIsExecuting(false);
      setCurrentTest('');
    }
  };

  // Executar automaticamente quando o componente é montado
  useEffect(() => {
    executeComprehensiveDiagnostic();
  }, []);

  const getStatusColor = (status: 'healthy' | 'partial' | 'degraded' | 'critical') => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'partial':
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header e Controles */}
      <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-500" />
            Diagnóstico Automático - Todas Edge Functions VPS
          </CardTitle>
          <p className="text-muted-foreground">
            Executando teste automático de todas as Edge Functions que conectam com a VPS
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={executeComprehensiveDiagnostic}
            disabled={isExecuting}
            size="lg"
            className="w-full"
          >
            {isExecuting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Executando Diagnóstico...
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4 mr-2" />
                Executar Novamente
              </>
            )}
          </Button>

          {isExecuting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              {currentTest && (
                <p className="text-sm text-muted-foreground">
                  Executando: {currentTest}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logs de Execução */}
      {logs.length > 0 && (
        <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Logs de Execução em Tempo Real</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-60 w-full">
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="text-sm font-mono bg-black/10 p-2 rounded">
                    {log}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Resultados do Diagnóstico */}
      {diagnostic && (
        <div className="space-y-6">
          {/* Resumo Executivo */}
          <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-blue-500" />
                Resumo Executivo do Diagnóstico
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Métricas Gerais */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{diagnostic.successCount}</div>
                  <div className="text-sm text-gray-600">Sucessos</div>
                </div>
                <div className="text-center p-4 bg-white/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{diagnostic.failureCount}</div>
                  <div className="text-sm text-gray-600">Falhas</div>
                </div>
                <div className="text-center p-4 bg-white/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{diagnostic.totalTests}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div className="text-center p-4 bg-white/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{diagnostic.totalDuration}ms</div>
                  <div className="text-sm text-gray-600">Duração</div>
                </div>
              </div>

              {/* Status por Categoria */}
              <div>
                <h4 className="font-semibold mb-3">Status por Categoria</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                    <span className="flex items-center gap-2">
                      <Network className="h-4 w-4" />
                      Edge Functions
                    </span>
                    <Badge className={getStatusColor(diagnostic.summary.edgeFunctions)}>
                      {diagnostic.summary.edgeFunctions.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                    <span className="flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      VPS Conectividade
                    </span>
                    <Badge className={getStatusColor(diagnostic.summary.vpsConnectivity)}>
                      {diagnostic.summary.vpsConnectivity.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Autenticação
                    </span>
                    <Badge className={getStatusColor(diagnostic.summary.authentication)}>
                      {diagnostic.summary.authentication.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalhes dos Testes */}
          <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
            <CardHeader>
              <CardTitle>Detalhes de Todos os Testes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {diagnostic.results.map((result, index) => (
                  <Card key={index} className={`border ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.success)}
                          <span className="font-medium">{result.functionName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={result.success ? "default" : "destructive"}>
                            {result.success ? "Sucesso" : "Falha"}
                          </Badge>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {result.duration}ms
                          </span>
                        </div>
                      </div>
                      
                      {result.error && (
                        <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-sm">
                          <strong>Erro:</strong> {result.error}
                        </div>
                      )}
                      
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                          Ver detalhes completos
                        </summary>
                        <div className="mt-2 space-y-2">
                          <div>
                            <strong>Payload:</strong>
                            <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                              {JSON.stringify(result.details.payload, null, 2)}
                            </pre>
                          </div>
                          {result.response && (
                            <div>
                              <strong>Response:</strong>
                              <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                                {JSON.stringify(result.response, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </details>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recomendações */}
          <Card className="bg-orange-50 border border-orange-200 rounded-3xl shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="h-5 w-5" />
                Recomendações de Ação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {diagnostic.recommendations.map((rec, index) => (
                  <div key={index} className="p-3 bg-white border border-orange-200 rounded-lg">
                    <span className="text-orange-800">{rec}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-gray-500">
            Diagnóstico executado em: {new Date().toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};
