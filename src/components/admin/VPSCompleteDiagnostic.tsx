
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle, XCircle, AlertTriangle, Play } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface DiagnosticResult {
  test: string;
  success: boolean;
  details: any;
  duration: number;
  error?: string;
}

interface DiagnosticSummary {
  totalTests: number;
  successfulTests: number;
  failedTests: number;
  successRate: number;
  totalDuration: number;
  overallSuccess: boolean;
}

interface DiagnosticResponse {
  success: boolean;
  diagnostic?: {
    summary: DiagnosticSummary;
    results: DiagnosticResult[];
    recommendations: string[];
    timestamp: string;
  };
  error?: string;
}

export const VPSCompleteDiagnostic = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [diagnostic, setDiagnostic] = useState<DiagnosticResponse | null>(null);

  const runCompleteDiagnostic = async () => {
    setIsRunning(true);
    setDiagnostic(null);

    try {
      console.log('[VPS Diagnostic] 🚀 Iniciando diagnóstico completo...');
      
      const { data, error } = await supabase.functions.invoke('vps_complete_diagnostic');

      if (error) {
        throw new Error(error.message);
      }

      setDiagnostic(data);

      if (data.success && data.diagnostic?.summary.overallSuccess) {
        toast.success('🎉 Todos os testes passaram! Sistema está funcionando perfeitamente.');
      } else {
        toast.warning(`⚠️ ${data.diagnostic?.summary.successfulTests || 0}/${data.diagnostic?.summary.totalTests || 0} testes passaram.`);
      }

    } catch (error: any) {
      console.error('[VPS Diagnostic] ❌ Erro:', error);
      toast.error(`Erro no diagnóstico: ${error.message}`);
      setDiagnostic({
        success: false,
        error: error.message
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Diagnóstico Completo VPS WhatsApp
          </CardTitle>
          <p className="text-sm text-gray-600">
            Teste completo de conectividade, autenticação, criação de instâncias e webhook
          </p>
        </CardHeader>
        <CardContent>
          <Button
            onClick={runCompleteDiagnostic}
            disabled={isRunning}
            size="lg"
            className="w-full"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Executando Diagnóstico Completo...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Executar Diagnóstico Completo
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {diagnostic && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {diagnostic.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Resultados do Diagnóstico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {diagnostic.diagnostic && (
              <>
                {/* Resumo */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {diagnostic.diagnostic.summary.successfulTests}
                    </div>
                    <div className="text-sm text-gray-600">Sucessos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {diagnostic.diagnostic.summary.failedTests}
                    </div>
                    <div className="text-sm text-gray-600">Falhas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {diagnostic.diagnostic.summary.successRate}%
                    </div>
                    <div className="text-sm text-gray-600">Taxa de Sucesso</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {diagnostic.diagnostic.summary.totalDuration}ms
                    </div>
                    <div className="text-sm text-gray-600">Tempo Total</div>
                  </div>
                </div>

                <Progress 
                  value={diagnostic.diagnostic.summary.successRate} 
                  className="h-3"
                />

                {/* Resultados dos Testes */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg">Detalhes dos Testes:</h4>
                  {diagnostic.diagnostic.results.map((result, index) => (
                    <Card key={index} className={getStatusColor(result.success)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(result.success)}
                            <span className="font-medium">{result.test}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={result.success ? "default" : "destructive"}>
                              {result.success ? "Sucesso" : "Falha"}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {result.duration}ms
                            </span>
                          </div>
                        </div>
                        
                        {result.error && (
                          <div className="p-2 bg-red-100 rounded text-sm text-red-700 mb-2">
                            <strong>Erro:</strong> {result.error}
                          </div>
                        )}
                        
                        <details className="text-sm">
                          <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                            Ver detalhes técnicos
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Recomendações */}
                {diagnostic.diagnostic.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-lg">Recomendações:</h4>
                    <div className="space-y-2">
                      {diagnostic.diagnostic.recommendations.map((rec, index) => (
                        <div key={index} className="p-3 bg-yellow-50 border-l-4 border-yellow-400 text-sm">
                          {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {diagnostic.error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded">
                <div className="text-red-800 font-medium">Erro no Diagnóstico:</div>
                <div className="text-red-700 text-sm mt-1">{diagnostic.error}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
