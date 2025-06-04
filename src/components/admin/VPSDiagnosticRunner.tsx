
import { useState, useEffect } from "react";
import { DiagnosticExecutor } from "@/services/vps/diagnosticExecutor";
import type { ComprehensiveDiagnostic } from "@/services/vps/diagnosticService";

export const VPSDiagnosticRunner = () => {
  const [diagnostic, setDiagnostic] = useState<ComprehensiveDiagnostic | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev, logMessage]);
    console.log(`[VPS Diagnostic Runner] ${message}`);
  };

  // Executar automaticamente quando o componente é montado
  useEffect(() => {
    const runDiagnostic = async () => {
      setIsExecuting(true);
      addLog("🚀 INICIANDO DIAGNÓSTICO AUTOMÁTICO VPS");
      
      try {
        addLog("📋 Executando plano de análise completo...");
        const result = await DiagnosticExecutor.executePlan();
        
        setDiagnostic(result);
        addLog("✅ Diagnóstico concluído com sucesso!");
        addLog(`📊 RESULTADO: ${result.overallStatus.toUpperCase()} - ${result.successCount}/${result.totalTests} testes passaram`);
        
        // Log detalhado dos resultados
        console.log("=== DIAGNÓSTICO VPS COMPLETO ===");
        console.log("Status Geral:", result.overallStatus);
        console.log("Sucessos:", result.successCount);
        console.log("Falhas:", result.failureCount);
        console.log("Duração Total:", result.totalDuration + "ms");
        console.log("Análise por Componente:", result.analysis);
        console.log("Recomendações:", result.recommendations);
        console.log("Detalhes dos Testes:");
        result.results.forEach((test, index) => {
          console.log(`${index + 1}. ${test.test}: ${test.success ? 'SUCESSO' : 'FALHA'} (${test.duration}ms)`);
          if (!test.success) {
            console.log(`   Erro: ${JSON.stringify(test.details, null, 2)}`);
          }
          if (test.recommendations?.length > 0) {
            console.log(`   Recomendações: ${test.recommendations.join(', ')}`);
          }
        });
        console.log("==============================");
        
      } catch (error: any) {
        addLog(`❌ ERRO: ${error.message}`);
        console.error('[VPS Diagnostic Runner] Error:', error);
      } finally {
        setIsExecuting(false);
      }
    };

    runDiagnostic();
  }, []);

  const getStatusEmoji = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy': return '🟢';
      case 'warning': return '🟡';
      case 'critical': return '🔴';
      default: return '⚪';
    }
  };

  const getAnalysisEmoji = (status: string) => {
    switch (status) {
      case 'ok': return '✅';
      case 'degraded':
      case 'partial': return '⚠️';
      case 'failed': return '❌';
      default: return '⚪';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-xl font-bold text-blue-800 mb-2">
          🔍 Diagnóstico VPS - Execução Automática
        </h2>
        <p className="text-blue-600">
          Executando análise completa pós-atualização do token VPS...
        </p>
      </div>

      {isExecuting && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-yellow-800 font-medium">Executando diagnóstico...</span>
          </div>
        </div>
      )}

      {logs.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-2">📋 Logs de Execução</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="text-sm font-mono text-gray-700 bg-white p-1 rounded">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {diagnostic && (
        <div className="space-y-6">
          {/* Status Geral */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
              <span>{getStatusEmoji(diagnostic.overallStatus)}</span>
              <span>STATUS GERAL: {diagnostic.overallStatus.toUpperCase()}</span>
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{diagnostic.successCount}</div>
                <div className="text-sm text-gray-600">Sucessos</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{diagnostic.failureCount}</div>
                <div className="text-sm text-gray-600">Falhas</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{diagnostic.totalTests}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{diagnostic.totalDuration}ms</div>
                <div className="text-sm text-gray-600">Duração</div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">🔍 Análise por Componente</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span>🌐 Conectividade VPS</span>
                  <span className="flex items-center space-x-1">
                    <span>{getAnalysisEmoji(diagnostic.analysis.connectivity)}</span>
                    <span className="text-sm font-medium">{diagnostic.analysis.connectivity.toUpperCase()}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span>🔐 Autenticação VPS</span>
                  <span className="flex items-center space-x-1">
                    <span>{getAnalysisEmoji(diagnostic.analysis.authentication)}</span>
                    <span className="text-sm font-medium">{diagnostic.analysis.authentication.toUpperCase()}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span>⚙️ Serviços VPS</span>
                  <span className="flex items-center space-x-1">
                    <span>{getAnalysisEmoji(diagnostic.analysis.services)}</span>
                    <span className="text-sm font-medium">{diagnostic.analysis.services.toUpperCase()}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span>🔄 Fluxo Completo</span>
                  <span className="flex items-center space-x-1">
                    <span>{getAnalysisEmoji(diagnostic.analysis.flow)}</span>
                    <span className="text-sm font-medium">{diagnostic.analysis.flow.toUpperCase()}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Detalhes dos Testes */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4">📊 Detalhes dos Testes</h3>
            <div className="space-y-4">
              {diagnostic.results.map((result, index) => (
                <div key={index} className={`border rounded-lg p-4 ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span>{result.success ? '✅' : '❌'}</span>
                      <span className="font-medium">{result.test}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {result.success ? 'SUCESSO' : 'FALHA'}
                      </span>
                      <span className="text-xs text-gray-500">{result.duration}ms</span>
                    </div>
                  </div>
                  
                  {result.recommendations && result.recommendations.length > 0 && (
                    <div className="mt-2">
                      <div className="text-sm font-medium mb-1 text-orange-600">⚠️ Recomendações:</div>
                      <ul className="text-sm space-y-1">
                        {result.recommendations.map((rec, i) => (
                          <li key={i} className="text-gray-700">• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                      Ver detalhes técnicos
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          </div>

          {/* Recomendações Gerais */}
          {diagnostic.recommendations.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4 text-orange-800">🔧 Recomendações de Correção</h3>
              <div className="space-y-2">
                {diagnostic.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-orange-600 mt-1">•</span>
                    <span className="text-orange-800">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-center text-sm text-gray-500">
            Diagnóstico executado em: {new Date(diagnostic.timestamp).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};
