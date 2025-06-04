
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle, XCircle, Loader2, Server, Wifi } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface TestResult {
  test: string;
  success: boolean;
  duration: number;
  details: any;
  timestamp: string;
}

export const VPSConnectivityTest = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const runComprehensiveTest = async () => {
    setTesting(true);
    setResults([]);
    
    const tests = [
      { name: 'vps_connectivity', label: 'Conectividade VPS' },
      { name: 'vps_auth', label: 'Autenticação VPS' },
      { name: 'vps_services', label: 'Serviços VPS' },
      { name: 'full_flow', label: 'Fluxo Completo (check_server)' }
    ];

    try {
      for (const test of tests) {
        console.log(`[Diagnóstico] Executando teste: ${test.name}`);
        
        try {
          const { data, error } = await supabase.functions.invoke('vps_diagnostic', {
            body: { 
              test: test.name,
              vpsAction: test.name === 'full_flow' ? 'check_server' : undefined
            }
          });

          if (error) {
            throw error;
          }

          const result: TestResult = {
            test: test.label,
            success: data.success || false,
            duration: data.duration || 0,
            details: data.details || {},
            timestamp: data.timestamp || new Date().toISOString()
          };

          setResults(prev => [...prev, result]);
          
          if (result.success) {
            toast.success(`✅ ${test.label}: Sucesso`);
          } else {
            toast.error(`❌ ${test.label}: Falhou`);
          }

        } catch (error: any) {
          console.error(`[Diagnóstico] Erro no teste ${test.name}:`, error);
          
          const errorResult: TestResult = {
            test: test.label,
            success: false,
            duration: 0,
            details: { error: error.message },
            timestamp: new Date().toISOString()
          };
          
          setResults(prev => [...prev, errorResult]);
          toast.error(`❌ ${test.label}: ${error.message}`);
        }

        // Pequena pausa entre testes
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const successCount = results.filter(r => r.success).length;
      const totalTests = tests.length;
      
      if (successCount === totalTests) {
        toast.success("🎉 Todos os testes passaram! VPS conectada e funcionando.");
      } else {
        toast.warning(`⚠️ ${successCount}/${totalTests} testes passaram. Verifique os detalhes.`);
      }

    } catch (error: any) {
      console.error('[Diagnóstico] Erro geral:', error);
      toast.error(`Erro no diagnóstico: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5 text-blue-500" />
          Teste de Conectividade VPS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Botão de Teste */}
        <Button
          onClick={runComprehensiveTest}
          disabled={testing}
          className="w-full"
          size="lg"
        >
          {testing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Executando Diagnóstico...
            </>
          ) : (
            <>
              <Wifi className="h-4 w-4 mr-2" />
              Executar Diagnóstico Completo
            </>
          )}
        </Button>

        {/* Resultados */}
        {results.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-semibold">Resultados dos Testes:</h4>
              
              {results.map((result, index) => (
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
                        <span className="text-xs text-gray-500">
                          {formatDuration(result.duration)}
                        </span>
                      </div>
                    </div>
                    
                    {!result.success && result.details.error && (
                      <div className="mt-2 p-2 bg-red-100 rounded text-sm text-red-700">
                        <strong>Erro:</strong> {result.details.error}
                      </div>
                    )}
                    
                    {result.success && result.details && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                          Ver detalhes técnicos
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Resumo */}
        {results.length > 0 && (
          <>
            <Separator />
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{results.filter(r => r.success).length} Sucessos</span>
                </div>
                <div className="flex items-center gap-1">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span>{results.filter(r => !r.success).length} Falhas</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
