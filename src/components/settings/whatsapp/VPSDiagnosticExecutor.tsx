
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Clock, AlertTriangle, PlayCircle, RefreshCw } from "lucide-react";
import { DiagnosticExecutor } from "@/services/vps/diagnosticExecutor";
import type { ComprehensiveDiagnostic } from "@/services/vps/diagnosticService";

export const VPSDiagnosticExecutor = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [diagnostic, setDiagnostic] = useState<ComprehensiveDiagnostic | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev, logMessage]);
    console.log(`[VPS Diagnostic Executor] ${message}`);
  };

  const executeDiagnostic = async () => {
    setIsExecuting(true);
    setDiagnostic(null);
    setLogs([]);
    setProgress(0);

    try {
      addLog("🚀 INICIANDO DIAGNÓSTICO COMPLETO VPS - PÓS-ATUALIZAÇÃO TOKEN");
      setProgress(10);

      addLog("📋 FASE 1: Executando plano de análise via DiagnosticExecutor...");
      setProgress(20);

      // Execute the comprehensive diagnostic
      const result = await DiagnosticExecutor.executePlan();
      
      setProgress(90);
      addLog("✅ Diagnóstico concluído com sucesso!");
      
      setDiagnostic(result);
      setProgress(100);

      // Log summary
      addLog(`📊 RESUMO: ${result.overallStatus.toUpperCase()} - ${result.successCount}/${result.totalTests} testes passaram`);
      
    } catch (error: any) {
      addLog(`❌ ERRO: ${error.message}`);
      console.error('[VPS Diagnostic Executor] Error:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (status: 'healthy' | 'warning' | 'critical') => {
    const config = {
      healthy: { variant: 'default' as const, color: 'bg-green-500', label: 'SAUDÁVEL' },
      warning: { variant: 'secondary' as const, color: 'bg-yellow-500', label: 'ATENÇÃO' },
      critical: { variant: 'destructive' as const, color: 'bg-red-500', label: 'CRÍTICO' }
    };

    const { variant, label } = config[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header e Controles */}
      <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-blue-500" />
            Executor de Diagnóstico VPS - FASE 1
          </CardTitle>
          <CardDescription>
            Execução automática do plano de análise completo pós-atualização do token VPS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={executeDiagnostic}
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
                Executar Diagnóstico Completo
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logs de Execução */}
      {logs.length > 0 && (
        <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Logs de Execução</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-40 w-full">
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
        <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Resultados do Diagnóstico</span>
              {getStatusBadge(diagnostic.overallStatus)}
            </CardTitle>
            <CardDescription>
              Executado em: {new Date(diagnostic.timestamp).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Geral */}
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
                <div className="text-2xl font-bold text-purple-600">{formatDuration(diagnostic.totalDuration)}</div>
                <div className="text-sm text-gray-600">Duração</div>
              </div>
            </div>

            {/* Análise por Componente */}
            <div>
              <h4 className="font-semibold mb-3">Análise por Componente</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                  <span>🌐 Conectividade VPS</span>
                  {getStatusIcon(diagnostic.analysis.connectivity === 'ok')}
                </div>
                <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                  <span>🔐 Autenticação VPS</span>
                  {getStatusIcon(diagnostic.analysis.authentication === 'ok')}
                </div>
                <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                  <span>⚙️ Serviços VPS</span>
                  {getStatusIcon(diagnostic.analysis.services === 'ok')}
                </div>
                <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                  <span>🔄 Fluxo Completo</span>
                  {getStatusIcon(diagnostic.analysis.flow === 'ok')}
                </div>
              </div>
            </div>

            {/* Detalhes dos Testes */}
            <div>
              <h4 className="font-semibold mb-3">Detalhes dos Testes</h4>
              <div className="space-y-3">
                {diagnostic.results.map((result, index) => (
                  <Card key={index} className={`border ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.success)}
                          <span className="font-medium">{result.test}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={result.success ? "default" : "destructive"}>
                            {result.success ? "Sucesso" : "Falha"}
                          </Badge>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(result.duration)}
                          </span>
                        </div>
                      </div>
                      
                      {result.recommendations && result.recommendations.length > 0 && (
                        <div className="mt-3">
                          <div className="text-sm font-medium mb-1 flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            Recomendações:
                          </div>
                          <ul className="text-sm space-y-1">
                            {result.recommendations.map((rec, i) => (
                              <li key={i} className="text-gray-700">• {rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                          Ver detalhes técnicos
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Recomendações Gerais */}
            {diagnostic.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Recomendações de Correção
                </h4>
                <div className="space-y-2">
                  {diagnostic.recommendations.map((rec, index) => (
                    <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <span className="text-orange-800">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
