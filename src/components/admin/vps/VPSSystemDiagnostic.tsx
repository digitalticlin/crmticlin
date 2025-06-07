
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Server, 
  Wifi, 
  Settings,
  Loader2,
  Search,
  Key,
  Link
} from "lucide-react";

interface DiagnosticResult {
  success: boolean;
  diagnostic?: {
    timestamp: string;
    analysisType?: string;
    summary: {
      totalTests: number;
      successfulTests: number;
      failedTests: number;
      successRate: number;
      overallSuccess: boolean;
      deepAnalysisComplete?: boolean;
    };
    results: Array<{
      test: string;
      success: boolean;
      duration: number;
      details: any;
      error?: string;
    }>;
    recommendations: string[];
  };
  error?: string;
}

export const VPSSystemDiagnostic = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);

  const runDiagnostic = async () => {
    try {
      setTesting(true);
      toast.info("🔬 Executando análise profunda da VPS...");

      const { data, error } = await supabase.functions.invoke('vps_complete_diagnostic', {
        body: {}
      });

      if (error) {
        throw new Error(error.message);
      }

      setResult(data);
      
      if (data.diagnostic?.summary?.overallSuccess) {
        toast.success("✅ VPS está funcionando perfeitamente!");
      } else {
        toast.warning("🔬 Análise profunda concluída - verificar detalhes");
      }

    } catch (error: any) {
      console.error('Erro no diagnóstico:', error);
      toast.error(`❌ Falha no diagnóstico: ${error.message}`);
      
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setTesting(false);
    }
  };

  const getHealthBadge = (health: boolean) => {
    return health ? (
      <Badge className="bg-green-600">SAUDÁVEL</Badge>
    ) : (
      <Badge variant="destructive">PROBLEMAS</Badge>
    );
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getTestIcon = (testName: string) => {
    if (testName.includes('Connectivity')) return <Wifi className="h-4 w-4" />;
    if (testName.includes('Authentication')) return <Key className="h-4 w-4" />;
    if (testName.includes('Endpoints')) return <Link className="h-4 w-4" />;
    if (testName.includes('Token')) return <Settings className="h-4 w-4" />;
    return <Search className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <CardTitle>Análise Profunda do Sistema VPS</CardTitle>
          </div>
          <Button 
            onClick={runDiagnostic} 
            disabled={testing}
            className="flex items-center gap-2"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Análise Profunda
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {!result && (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Clique em "Análise Profunda" para descobrir exatamente onde está o problema</p>
            <p className="text-xs mt-2">Esta análise testa múltiplos formatos de autenticação e endpoints</p>
          </div>
        )}

        {result && result.success && result.diagnostic && (
          <div className="space-y-6">
            {/* Status Geral */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="text-2xl">🔬</div>
                <div>
                  <h3 className="font-medium">
                    {result.diagnostic.analysisType === 'DEEP_ANALYSIS' ? 'Análise Profunda' : 'Diagnóstico'} Completo
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {result.diagnostic.summary.successfulTests}/{result.diagnostic.summary.totalTests} testes passaram
                    ({result.diagnostic.summary.successRate}%)
                  </p>
                </div>
              </div>
              {getHealthBadge(result.diagnostic.summary.overallSuccess)}
            </div>

            {/* Resultados dos Testes */}
            <div className="space-y-3">
              <h4 className="font-medium">Resultados Detalhados:</h4>
              {result.diagnostic.results.map((test, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getTestIcon(test.test)}
                      <span className="font-medium">{test.test}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(test.success)}
                      <span className="text-sm text-muted-foreground">
                        {test.duration}ms
                      </span>
                    </div>
                  </div>
                  
                  {test.error && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded mt-2">
                      ❌ {test.error}
                    </div>
                  )}
                  
                  {/* Detalhes específicos por tipo de teste */}
                  {test.test.includes('Authentication') && test.details?.allTests && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-medium">Testes de Autenticação:</p>
                      {test.details.allTests.map((authTest: any, i: number) => (
                        <div key={i} className="text-xs bg-gray-50 p-2 rounded flex justify-between">
                          <span>{authTest.headerType} + {authTest.endpoint}</span>
                          <span className={authTest.success ? 'text-green-600' : 'text-red-600'}>
                            {authTest.status} {authTest.success ? '✅' : '❌'}
                          </span>
                        </div>
                      ))}
                      
                      {test.details.workingAuth && (
                        <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                          ✅ Funcionando: {test.details.workingAuth} no endpoint {test.details.workingEndpoint}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {test.test.includes('Endpoints') && test.details?.endpointResults && (
                    <div className="mt-3 space-y-1">
                      <p className="text-sm font-medium">Endpoints Descobertos:</p>
                      {test.details.endpointResults.map((ep: any, i: number) => (
                        <div key={i} className="text-xs bg-gray-50 p-2 rounded flex justify-between">
                          <span>{ep.endpoint}</span>
                          <span className={ep.success ? 'text-green-600' : 'text-red-600'}>
                            {ep.status} {ep.success ? '✅' : '❌'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {test.test.includes('Token') && test.details?.tokenAnalysis && (
                    <div className="mt-3">
                      <p className="text-sm font-medium">Análise do Token:</p>
                      <div className="text-xs bg-gray-50 p-2 rounded space-y-1">
                        <div>Comprimento: {test.details.tokenAnalysis.length} caracteres</div>
                        <div>Formato válido: {test.details.tokenAnalysis.expectedLength ? '✅' : '❌'}</div>
                        <div>Preview: {test.details.tokenAnalysis.preview}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Recomendações */}
            {result.diagnostic.recommendations.length > 0 && (
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-blue-800">Análise e Recomendações:</h4>
                </div>
                <div className="space-y-1">
                  {result.diagnostic.recommendations.map((rec, index) => (
                    <div key={index} className="text-sm text-blue-700 flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5 text-xs">•</span>
                      <span className="flex-1">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground text-center">
              Análise executada em: {new Date(result.diagnostic.timestamp).toLocaleString('pt-BR')}
            </div>
          </div>
        )}

        {result && !result.success && (
          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="h-5 w-5 text-red-600" />
              <h4 className="font-medium text-red-800">Erro na Análise:</h4>
            </div>
            <p className="text-sm text-red-700">{result.error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
