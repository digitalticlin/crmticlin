
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Clock, AlertTriangle, Server, Copy } from "lucide-react";

interface DiagnosticResult {
  step: string;
  success: boolean;
  details: any;
  responseTime?: number;
  error?: string;
}

interface DiagnosticResponse {
  timestamp: string;
  vpsConfig: any;
  diagnostics: DiagnosticResult[];
  analysis: {
    totalTests: number;
    successfulTests: number;
    failedTests: number;
    avgResponseTime: number;
    recommendations: string[];
  };
  hostingerGuidance: any;
}

export const VPSComprehensiveDiagnostic = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<DiagnosticResponse | null>(null);

  const runComprehensiveDiagnostic = async () => {
    try {
      setTesting(true);
      toast.info("🔍 Executando diagnóstico completo da VPS...");

      const { data, error } = await supabase.functions.invoke('vps_comprehensive_diagnostic', {
        body: {}
      });

      if (error) {
        throw new Error(error.message);
      }

      setResults(data);
      
      const analysis = data.analysis;
      if (analysis.failedTests === 0) {
        toast.success("✅ Todos os testes passaram! VPS está funcionando corretamente.");
      } else if (analysis.successfulTests > 0) {
        toast.warning(`⚠️ ${analysis.failedTests} de ${analysis.totalTests} testes falharam.`);
      } else {
        toast.error("❌ Todos os testes falharam. VPS não está acessível.");
      }

    } catch (error: any) {
      console.error('Erro no diagnóstico:', error);
      toast.error(`❌ Falha no diagnóstico: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const getStepIcon = (result: DiagnosticResult) => {
    if (result.success) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStepTitle = (step: string) => {
    const titles: Record<string, string> = {
      '1_basic_connectivity': '1. Conectividade Básica',
      '2_authentication_test': '2. Teste de Autenticação',
      '3_instance_create_endpoint': '3. Endpoint /instance/create',
      '4_endpoint__instances': '4. Endpoint /instances',
      '4_endpoint__status': '5. Endpoint /status'
    };
    return titles[step] || step;
  };

  const copyHostingerCommand = () => {
    if (!results) return;
    
    const command = `curl -X POST http://31.97.24.222:3001/instance/create \\
  -H "Authorization: Bearer default-token" \\
  -H "Content-Type: application/json" \\
  -d '{"instanceId":"test_123","sessionName":"test","webhookUrl":"https://test.com/webhook","companyId":"test-uuid"}'`;
    
    navigator.clipboard.writeText(command);
    toast.success("Comando curl copiado! Execute diretamente na VPS para testar.");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-600" />
            <CardTitle>Diagnóstico Completo VPS</CardTitle>
          </div>
          <Button 
            onClick={runComprehensiveDiagnostic} 
            disabled={testing}
            className="flex items-center gap-2"
          >
            {testing ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Diagnosticando...
              </>
            ) : (
              <>
                <Server className="h-4 w-4" />
                Executar Diagnóstico
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {!results && (
          <div className="text-center py-8 text-muted-foreground">
            <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Execute o diagnóstico para verificar todos os aspectos da VPS</p>
            <p className="text-sm mt-2">Testará conectividade, autenticação, endpoints e mais</p>
          </div>
        )}

        {results && (
          <div className="space-y-6">
            {/* Resumo Geral */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-3 border rounded">
                <div className="text-2xl font-bold text-blue-600">
                  {results.analysis.totalTests}
                </div>
                <div className="text-sm text-muted-foreground">Total de Testes</div>
              </div>
              <div className="text-center p-3 border rounded">
                <div className="text-2xl font-bold text-green-600">
                  {results.analysis.successfulTests}
                </div>
                <div className="text-sm text-muted-foreground">Sucessos</div>
              </div>
              <div className="text-center p-3 border rounded">
                <div className="text-2xl font-bold text-red-600">
                  {results.analysis.failedTests}
                </div>
                <div className="text-sm text-muted-foreground">Falhas</div>
              </div>
              <div className="text-center p-3 border rounded">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(results.analysis.avgResponseTime || 0)}ms
                </div>
                <div className="text-sm text-muted-foreground">Tempo Médio</div>
              </div>
            </div>

            {/* Resultados Detalhados */}
            <div>
              <h4 className="font-medium mb-3">Resultados dos Testes:</h4>
              <div className="space-y-3">
                {results.diagnostics.map((result, index) => (
                  <div key={index} className="border rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStepIcon(result)}
                        <span className="font-medium">{getStepTitle(result.step)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.responseTime && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {result.responseTime}ms
                          </Badge>
                        )}
                        <Badge variant={result.success ? "default" : "destructive"}>
                          {result.success ? "SUCESSO" : "FALHA"}
                        </Badge>
                      </div>
                    </div>
                    
                    {result.error && (
                      <div className="text-sm text-red-600 mb-2">
                        Erro: {result.error}
                      </div>
                    )}
                    
                    {result.details && (
                      <div className="text-sm text-muted-foreground">
                        <details className="cursor-pointer">
                          <summary>Ver detalhes</summary>
                          <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recomendações */}
            {results.analysis.recommendations.length > 0 && (
              <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <h4 className="font-medium text-orange-800">Recomendações:</h4>
                </div>
                <ul className="space-y-2">
                  {results.analysis.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-orange-700 flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Comando Hostinger */}
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-blue-800">Teste Manual (conforme Hostinger):</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyHostingerCommand}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Comando
                </Button>
              </div>
              <p className="text-sm text-blue-700 mb-2">
                Execute este comando diretamente na VPS para testar localmente:
              </p>
              <pre className="text-xs bg-blue-100 p-2 rounded overflow-x-auto">
                curl -X POST http://31.97.24.222:3001/instance/create \<br/>
                &nbsp;&nbsp;-H "Authorization: Bearer default-token" \<br/>
                &nbsp;&nbsp;-H "Content-Type: application/json" \<br/>
                &nbsp;&nbsp;-d '{`{"instanceId":"test_123","sessionName":"test","webhookUrl":"https://test.com/webhook","companyId":"test-uuid"}`}'
              </pre>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              Diagnóstico executado em: {new Date(results.timestamp).toLocaleString('pt-BR')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
