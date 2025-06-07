
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2,
  Activity,
  RefreshCw,
  QrCode
} from "lucide-react";

interface TestResult {
  test: string;
  success: boolean;
  duration: number;
  details: any;
  error?: string;
}

interface DiagnosticSummary {
  totalTests: number;
  successfulTests: number;
  failedTests: number;
  successRate: number;
  overallSuccess: boolean;
  deepAnalysisComplete: boolean;
  version?: string;
}

export const VPSTestTrigger = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [summary, setSummary] = useState<DiagnosticSummary | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  const runCompleteTest = async () => {
    setIsRunning(true);
    setResults([]);
    setSummary(null);
    setRecommendations([]);
    
    toast.info("🔬 Executando análise V7.0 CORRIGIDA com teste de QR Code...");

    try {
      console.log('[VPS Test Trigger] 🚀 Iniciando teste V7.0 completo corrigido');

      const { data, error } = await supabase.functions.invoke('vps_complete_diagnostic', {
        body: {}
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success && data.diagnostic) {
        setResults(data.diagnostic.results);
        setSummary(data.diagnostic.summary);
        setRecommendations(data.diagnostic.recommendations || []);

        const { successfulTests, totalTests, overallSuccess } = data.diagnostic.summary;
        
        if (overallSuccess) {
          toast.success(`🎉 TODOS OS ${totalTests} TESTES PASSARAM! Sistema 100% funcional!`);
        } else {
          const failedTests = totalTests - successfulTests;
          toast.warning(`🔧 ${successfulTests}/${totalTests} testes passaram. ${failedTests} necessitam correção.`);
        }
      } else {
        throw new Error(data.error || 'Erro desconhecido no diagnóstico');
      }

    } catch (error: any) {
      console.error('[VPS Test Trigger] ❌ Erro:', error);
      toast.error(`❌ Erro no teste: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getTestIcon = (testName: string) => {
    if (testName.includes('Connectivity')) return '🌐';
    if (testName.includes('Authentication')) return '🔑';
    if (testName.includes('Endpoints')) return '🔍';
    if (testName.includes('Token')) return '🔐';
    if (testName.includes('Instance Creation')) return '🚀';
    if (testName.includes('QR Code')) return '📱';
    if (testName.includes('End to End')) return '🔄';
    return '📋';
  };

  return (
    <div className="space-y-6">
      {/* Botão de Teste */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Activity className="h-5 w-5" />
            Teste Completo V7.0 - CORRIGIDO com QR Code
          </CardTitle>
          <p className="text-blue-700 text-sm">
            Análise completa dos 7 testes com payload corrigido (instanceId) e teste de QR Code
          </p>
        </CardHeader>
        <CardContent>
          <Button
            onClick={runCompleteTest}
            disabled={isRunning}
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Executando Análise V7.0 Corrigida...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Executar Teste V7.0 (7 Testes + QR Code)
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resumo dos Resultados */}
      {summary && (
        <Card className={summary.overallSuccess ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {summary.overallSuccess ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              )}
              Resumo da Análise V7.0 Corrigida
              {summary.version && (
                <Badge variant="outline" className="text-xs">
                  {summary.version}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {summary.successfulTests}
                </div>
                <div className="text-sm text-muted-foreground">Sucessos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {summary.failedTests}
                </div>
                <div className="text-sm text-muted-foreground">Falhas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {summary.successRate}%
                </div>
                <div className="text-sm text-muted-foreground">Taxa Sucesso</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {summary.totalTests}
                </div>
                <div className="text-sm text-muted-foreground">Total Testes</div>
              </div>
            </div>
            
            <Progress value={summary.successRate} className="mb-4" />
            
            <div className="flex items-center justify-center gap-2">
              <Badge variant={summary.overallSuccess ? "default" : "destructive"} className="text-sm">
                {summary.overallSuccess ? "✅ SISTEMA 100% FUNCIONAL" : "🔧 CORREÇÕES NECESSÁRIAS"}
              </Badge>
              {summary.deepAnalysisComplete && (
                <Badge variant="outline" className="text-xs">
                  Análise Profunda V7.0
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultados Detalhados */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados Detalhados dos 7 Testes (V7.0)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className={`border rounded-lg p-4 ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getTestIcon(result.test)}</span>
                    {getStatusIcon(result.success)}
                    <span className="font-medium">{result.test}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? "SUCESSO" : "FALHA"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {result.duration}ms
                    </span>
                  </div>
                </div>
                
                {result.error && (
                  <div className="text-sm text-red-700 bg-red-100 p-2 rounded mb-2">
                    <strong>Erro:</strong> {result.error}
                  </div>
                )}
                
                {/* Detalhes específicos para Instance Creation */}
                {result.test.includes('Instance Creation') && result.details && (
                  <div className="text-sm space-y-1">
                    {result.success ? (
                      <div className="text-green-700 bg-green-100 p-2 rounded">
                        ✅ <strong>Payload Corrigido Funcionando:</strong> {result.details.successfulPayload || 'instanceId e sessionName funcionando'}
                        {result.details.correction && (
                          <div className="mt-1 text-xs">🔧 {result.details.correction}</div>
                        )}
                      </div>
                    ) : (
                      <div className="text-red-700 bg-red-100 p-2 rounded">
                        ❌ <strong>Payload corrigido ainda falhou:</strong> Verificar configuração VPS
                        {result.details.allPayloadTests && (
                          <div className="mt-2 space-y-1">
                            {result.details.allPayloadTests.map((test: any, i: number) => (
                              <div key={i} className="text-xs bg-red-50 p-1 rounded">
                                {test.payloadName}: {test.status} - {test.response?.error || 'Erro não especificado'}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Detalhes específicos para QR Code Generation */}
                {result.test.includes('QR Code') && result.details && (
                  <div className="text-sm space-y-1">
                    {result.success ? (
                      <div className="text-green-700 bg-green-100 p-2 rounded">
                        ✅ <strong>QR Code Gerado:</strong> {result.details.qrCodeLength} caracteres
                        {result.details.workingEndpoint && (
                          <div className="mt-1">🎯 Endpoint: {result.details.workingEndpoint}</div>
                        )}
                        {result.details.qrCodePreview && (
                          <div className="mt-1 text-xs font-mono bg-green-50 p-1 rounded">
                            {result.details.qrCodePreview}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-red-700 bg-red-100 p-2 rounded">
                        ❌ <strong>QR Code não gerado:</strong> {result.error}
                        {result.details.allQrEndpoints && (
                          <div className="mt-2 space-y-1">
                            <div className="text-xs font-medium">Endpoints testados:</div>
                            {result.details.allQrEndpoints.map((endpoint: any, i: number) => (
                              <div key={i} className="text-xs bg-red-50 p-1 rounded">
                                {endpoint.endpointName}: {endpoint.status || 'Erro'} - {endpoint.error || 'Sem QR Code'}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Detalhes específicos para Autenticação */}
                {result.test.includes('Authentication') && result.details?.workingAuth && (
                  <div className="text-sm text-green-700 bg-green-100 p-2 rounded">
                    ✅ <strong>Auth Funcionando:</strong> {result.details.workingAuth} no endpoint {result.details.workingEndpoint}
                  </div>
                )}

                {/* Detalhes específicos para End to End */}
                {result.test.includes('End to End') && result.details?.steps && (
                  <div className="text-sm space-y-1">
                    <div className="text-blue-700 bg-blue-100 p-2 rounded">
                      <strong>Fluxo End-to-End:</strong>
                      {result.details.steps.map((step: string, i: number) => (
                        <div key={i} className="text-xs mt-1">{step}</div>
                      ))}
                      {result.details.payloadUsed && (
                        <div className="mt-2 text-xs font-medium">🔧 {result.details.payloadUsed}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recomendações */}
      {recommendations.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              Análise Completa e Próximos Passos V7.0
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recommendations.map((rec, index) => (
                <div key={index} className="text-sm text-yellow-700 flex items-start gap-2">
                  <span className="text-yellow-500 mt-0.5 text-xs">•</span>
                  <span className="flex-1">{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
