
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Network, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  Wifi,
  Shield,
  Globe,
  Activity,
  Search,
  Target,
  Zap
} from "lucide-react";

export const VPSNetworkDiagnosticPanel = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);

  const runNetworkDiagnostic = async (testType: string = 'comprehensive') => {
    try {
      setIsRunning(true);
      toast.loading(`Executando diagnóstico de rede: ${testType}...`, { id: 'network-diagnostic' });

      const { data, error } = await supabase.functions.invoke('vps_network_deep_diagnostic', {
        body: { testType }
      });

      if (error) {
        throw new Error(`Erro na edge function: ${error.message}`);
      }

      setDiagnosticResult(data);
      
      if (data.success) {
        if (data.result.analysis?.productionFlowWorking) {
          toast.success('🎯 Fluxo de produção funcionando!', { id: 'network-diagnostic' });
        } else {
          toast.warning('⚠️ Problemas detectados na conectividade', { id: 'network-diagnostic' });
        }
      } else {
        toast.error('❌ Falha no diagnóstico de rede', { id: 'network-diagnostic' });
      }

    } catch (error: any) {
      console.error('[Network Diagnostic] ❌ Erro:', error);
      toast.error(`Erro: ${error.message}`, { id: 'network-diagnostic' });
      setDiagnosticResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? 
      <CheckCircle className="h-4 w-4 text-green-600" /> : 
      <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  const getStatusBadge = (success: boolean) => {
    return success ? 
      <Badge className="bg-green-100 text-green-800">OK</Badge> : 
      <Badge variant="destructive">FALHA</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Network className="h-6 w-6" />
            Diagnóstico Profundo de Rede VPS
          </CardTitle>
          <p className="text-blue-700 text-sm">
            Análise detalhada da conectividade Edge Function → VPS para identificar bloqueios de rede/firewall
          </p>
        </CardHeader>
      </Card>

      {/* Botões de Teste Específicos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button 
          onClick={() => runNetworkDiagnostic('external_connectivity')}
          disabled={isRunning}
          variant="outline"
          size="sm"
        >
          <Globe className="h-4 w-4 mr-1" />
          Conectividade Externa
        </Button>
        
        <Button 
          onClick={() => runNetworkDiagnostic('port_scanning')}
          disabled={isRunning}
          variant="outline"
          size="sm"
        >
          <Search className="h-4 w-4 mr-1" />
          Scan Portas
        </Button>
        
        <Button 
          onClick={() => runNetworkDiagnostic('firewall_detection')}
          disabled={isRunning}
          variant="outline"
          size="sm"
        >
          <Shield className="h-4 w-4 mr-1" />
          Detectar Firewall
        </Button>
        
        <Button 
          onClick={() => runNetworkDiagnostic('production_flow_exact')}
          disabled={isRunning}
          variant="outline"
          size="sm"
        >
          <Target className="h-4 w-4 mr-1" />
          Fluxo Produção
        </Button>
      </div>

      {/* Botão Diagnóstico Completo */}
      <Button 
        onClick={() => runNetworkDiagnostic('comprehensive')}
        disabled={isRunning}
        className="w-full"
        size="lg"
      >
        {isRunning ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Executando Diagnóstico Completo...
          </>
        ) : (
          <>
            <Zap className="h-5 w-5 mr-2" />
            Diagnóstico Completo de Rede
          </>
        )}
      </Button>

      {/* Resultados */}
      {diagnosticResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Resultados - {diagnosticResult.testType}
              <Badge variant={diagnosticResult.success ? "default" : "destructive"}>
                {diagnosticResult.success ? "Sucesso" : "Erro"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {diagnosticResult.success ? (
              <>
                {/* Edge Function Info */}
                {diagnosticResult.edgeFunctionInfo && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Informações da Edge Function:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>IP: <Badge variant="outline">{diagnosticResult.edgeFunctionInfo.edgeIP}</Badge></div>
                      <div>Região: <Badge variant="outline">{diagnosticResult.edgeFunctionInfo.region}</Badge></div>
                    </div>
                  </div>
                )}

                {/* Teste Individual */}
                {diagnosticResult.result.test && !diagnosticResult.result.comprehensive && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Resultado do Teste: {diagnosticResult.result.test}</h4>
                    
                    {/* Resultados de array */}
                    {diagnosticResult.result.results && (
                      <div className="space-y-2">
                        {diagnosticResult.result.results.map((result: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(result.success || result.accessible)}
                              <span className="text-sm">
                                {result.site || result.port || result.test || result.method || `Teste ${index + 1}`}
                              </span>
                              {result.responseTime && (
                                <Badge variant="outline">{result.responseTime}ms</Badge>
                              )}
                            </div>
                            {getStatusBadge(result.success || result.accessible)}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Summary */}
                    {diagnosticResult.result.summary && (
                      <div className="p-3 bg-blue-50 rounded">
                        <h5 className="font-medium text-sm mb-2">Resumo:</h5>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(diagnosticResult.result.summary).map(([key, value]) => (
                            <div key={key}>
                              <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}: </span>
                              <Badge variant="outline">{String(value)}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Diagnóstico Completo */}
                {diagnosticResult.result.comprehensive && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Análise Completa da Rede</h4>
                    
                    {/* Análise Geral */}
                    {diagnosticResult.result.analysis && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded">
                        <div className="text-center">
                          <div className="font-medium text-xs">Conectividade Externa</div>
                          {getStatusBadge(diagnosticResult.result.analysis.externalConnectivityOK)}
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-xs">Portas VPS</div>
                          {getStatusBadge(diagnosticResult.result.analysis.vpsPortsAccessible)}
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-xs">Fluxo Produção</div>
                          {getStatusBadge(diagnosticResult.result.analysis.productionFlowWorking)}
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-xs">Problema Principal</div>
                          <Badge variant="secondary" className="text-xs">
                            {diagnosticResult.result.analysis.likelyIssue?.split(' ').slice(0, 3).join(' ')}...
                          </Badge>
                        </div>
                      </div>
                    )}

                    {/* Problema Identificado */}
                    {diagnosticResult.result.analysis?.likelyIssue && (
                      <div className="p-4 bg-orange-50 border border-orange-200 rounded">
                        <h5 className="font-medium text-orange-800 mb-2">🎯 Problema Identificado:</h5>
                        <p className="text-orange-700 text-sm">{diagnosticResult.result.analysis.likelyIssue}</p>
                      </div>
                    )}

                    {/* Recomendações */}
                    {diagnosticResult.result.recommendations && diagnosticResult.result.recommendations.length > 0 && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded">
                        <h5 className="font-medium text-green-800 mb-3">💡 Recomendações:</h5>
                        <div className="space-y-2">
                          {diagnosticResult.result.recommendations.map((rec: string, index: number) => (
                            <div key={index} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span className="text-green-700 text-sm">{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Testes Detalhados */}
                    <div className="space-y-3">
                      <h5 className="font-medium">Detalhes dos Testes:</h5>
                      {Object.entries(diagnosticResult.result.tests).map(([testName, testData]: [string, any]) => (
                        <div key={testName} className="p-3 border border-gray-200 rounded">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm capitalize">{testName.replace('_', ' ')}</span>
                            {testData.success !== undefined && getStatusBadge(testData.success)}
                          </div>
                          {testData.error && (
                            <p className="text-red-600 text-xs">{testData.error}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  ID: {diagnosticResult.diagnosticId} | {diagnosticResult.timestamp}
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="text-red-700">Falha no diagnóstico de rede</p>
                <p className="text-sm text-gray-600">{diagnosticResult.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
