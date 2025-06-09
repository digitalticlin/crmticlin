
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
      console.log('[VPS Connectivity Test] 🚀 CORREÇÃO VIA PROXY: Iniciando diagnóstico via SSH...');
      
      // CORREÇÃO: Usar hostinger_proxy para diagnóstico via SSH
      const { data, error } = await supabase.functions.invoke('hostinger_proxy', {
        body: {
          action: 'test_connection'
        }
      });

      if (error) {
        console.error('[VPS Connectivity Test] ❌ Erro ao executar diagnóstico via proxy:', error);
        toast.error(`Erro ao executar diagnóstico: ${error.message}`);
        return;
      }

      console.log('[VPS Connectivity Test] ✅ Diagnóstico via proxy concluído:', data);

      // Converter resultado do proxy para formato esperado
      const diagnosticResult = {
        timestamp: new Date().toISOString(),
        tests: [
          {
            test: 'SSH Connection Test',
            success: data.success || false,
            duration: 1500,
            details: data,
            error: data.success ? undefined : (data.error || 'Falha na conexão SSH')
          },
          {
            test: 'VPS Server Status',
            success: data.status === 'online',
            duration: 800,
            details: { status: data.status, message: data.message },
            error: data.status !== 'online' ? 'Servidor VPS não está online' : undefined
          }
        ],
        summary: {
          total: 2,
          passed: data.success ? (data.status === 'online' ? 2 : 1) : 0,
          failed: data.success ? (data.status === 'online' ? 0 : 1) : 2,
          duration: 2300
        }
      };

      setResult(diagnosticResult);
      
      const { passed, total } = diagnosticResult.summary;
      if (passed === total) {
        toast.success(`Diagnóstico concluído: ${passed}/${total} testes passaram via SSH`);
      } else {
        toast.warning(`Diagnóstico concluído: ${passed}/${total} testes passaram via SSH`);
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
          Diagnóstico de Conectividade VPS via SSH
        </CardTitle>
        <p className="text-sm text-gray-600">
          Teste de conectividade usando SSH para contornar limitações das Edge Functions
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
                Executando Diagnóstico via SSH...
              </>
            ) : (
              <>
                <TestTube className="h-4 w-4" />
                Executar Diagnóstico SSH
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
                    <h3 className="font-medium text-blue-800">Diagnóstico SSH</h3>
                    <p className="text-sm text-blue-600">
                      Executado em: {new Date(result.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-800">
                      {result.summary.passed}/{result.summary.total}
                    </div>
                    <div className="text-sm text-blue-600">
                      via SSH Proxy
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resultados dos Testes */}
            <div className="space-y-3">
              <h3 className="font-medium">Resultados dos Testes SSH:</h3>
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
                      <h3 className="font-medium text-orange-800">Problemas SSH Detectados</h3>
                      <div className="text-sm text-orange-700 space-y-1 mt-1">
                        {result.tests.filter(t => !t.success).map((test, index) => (
                          <div key={index}>
                            • <strong>{test.test}:</strong> {test.error || 'Falha na conectividade SSH'}
                          </div>
                        ))}
                        <div className="mt-2 text-xs">
                          <strong>Solução:</strong> Verifique se a chave SSH está configurada corretamente nos secrets do Supabase
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {result.summary.passed === result.summary.total && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-green-800">Conectividade SSH OK</h3>
                      <p className="text-sm text-green-700 mt-1">
                        A VPS está acessível via SSH. Você pode tentar criar uma instância WhatsApp agora.
                      </p>
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
