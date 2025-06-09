
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TestTube, CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DiagnosticTest {
  test: string;
  success: boolean;
  status?: number;
  duration: number;
  details?: any;
  error?: string;
}

interface DiagnosticResult {
  timestamp: string;
  tests: DiagnosticTest[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    duration: number;
  };
}

export const VPSConnectivityTest = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);

  const runDiagnostic = async () => {
    setIsRunning(true);
    setResult(null);
    
    try {
      console.log('[VPS Connectivity Test] 🚀 Iniciando diagnóstico completo...');
      
      const { data, error } = await supabase.functions.invoke('vps_connectivity_diagnostic', {
        body: {}
      });

      if (error) {
        console.error('[VPS Connectivity Test] ❌ Erro ao executar diagnóstico:', error);
        toast.error(`Erro ao executar diagnóstico: ${error.message}`);
        return;
      }

      console.log('[VPS Connectivity Test] ✅ Diagnóstico concluído:', data);
      setResult(data);
      
      const { passed, total } = data.summary;
      if (passed === total) {
        toast.success(`Diagnóstico concluído: ${passed}/${total} testes passaram`);
      } else {
        toast.warning(`Diagnóstico concluído: ${passed}/${total} testes passaram`);
      }

    } catch (error: any) {
      console.error('[VPS Connectivity Test] ❌ Erro inesperado:', error);
      toast.error(`Erro inesperado: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (success: boolean, status?: number) => {
    if (success) {
      return <Badge className="bg-green-500">SUCESSO</Badge>;
    } else {
      return <Badge variant="destructive">FALHA{status ? ` (${status})` : ''}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5 text-blue-600" />
          Diagnóstico de Conectividade VPS
        </CardTitle>
        <p className="text-sm text-gray-600">
          Teste completo da conectividade entre Supabase Edge Functions e a VPS
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runDiagnostic}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Executando Diagnóstico...
              </>
            ) : (
              <>
                <TestTube className="h-4 w-4" />
                Executar Diagnóstico
              </>
            )}
          </Button>
          
          {result && (
            <Button 
              variant="outline" 
              onClick={runDiagnostic}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Executar Novamente
            </Button>
          )}
        </div>

        {result && (
          <div className="space-y-4">
            {/* Resumo */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-blue-800">Resumo do Diagnóstico</h3>
                    <p className="text-sm text-blue-600">
                      Executado em: {new Date(result.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-800">
                      {result.summary.passed}/{result.summary.total}
                    </div>
                    <div className="text-sm text-blue-600">
                      {result.summary.duration}ms
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resultados dos Testes */}
            <div className="space-y-3">
              <h3 className="font-medium">Resultados dos Testes:</h3>
              {result.tests.map((test, index) => (
                <Card key={index} className={`border-l-4 ${test.success ? 'border-l-green-500' : 'border-l-red-500'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(test.success)}
                        <span className="font-medium">{test.test}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(test.success, test.status)}
                        <span className="text-sm text-gray-500">{test.duration}ms</span>
                      </div>
                    </div>
                    
                    {test.error && (
                      <div className="text-sm text-red-600 mb-2">
                        <strong>Erro:</strong> {test.error}
                      </div>
                    )}
                    
                    {test.details && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                          Ver detalhes técnicos
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40">
                          {JSON.stringify(test.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Análise e Recomendações */}
            {result.summary.failed > 0 && (
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-orange-800">Problemas Detectados</h3>
                      <div className="text-sm text-orange-700 space-y-1 mt-1">
                        {result.tests.filter(t => !t.success).map((test, index) => (
                          <div key={index}>
                            • <strong>{test.test}:</strong> {test.error || 'Falha na conectividade'}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
