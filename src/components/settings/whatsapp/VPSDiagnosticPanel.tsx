
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { 
  Activity, 
  Server, 
  Shield, 
  Settings, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle
} from "lucide-react";

interface DiagnosticResult {
  test: string;
  success: boolean;
  timestamp: string;
  duration: number;
  details: any;
  errors?: string[];
  recommendations?: string[];
}

export const VPSDiagnosticPanel = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const runDiagnostic = async (test: string, vpsAction?: string) => {
    setLoading(test);
    try {
      console.log(`[VPS Diagnostic Panel] 🧪 Executando teste: ${test}`);
      
      const { data, error } = await supabase.functions.invoke('vps_diagnostic', {
        body: { test, vpsAction }
      });

      if (error) {
        throw error;
      }

      setResults(prev => [data, ...prev.filter(r => r.test !== test)]);
      console.log(`[VPS Diagnostic Panel] ✅ Teste ${test} concluído`);
      
    } catch (error: any) {
      console.error(`[VPS Diagnostic Panel] ❌ Erro no teste ${test}:`, error);
      
      const errorResult: DiagnosticResult = {
        test,
        success: false,
        timestamp: new Date().toISOString(),
        duration: 0,
        details: { error: error.message },
        errors: [error.message]
      };
      
      setResults(prev => [errorResult, ...prev.filter(r => r.test !== test)]);
    } finally {
      setLoading(null);
    }
  };

  const getTestIcon = (test: string) => {
    switch (test) {
      case 'edge_function': return <Activity className="h-4 w-4" />;
      case 'vps_connectivity': return <Server className="h-4 w-4" />;
      case 'vps_auth': return <Shield className="h-4 w-4" />;
      case 'vps_services': return <Settings className="h-4 w-4" />;
      case 'full_flow': return <RefreshCw className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (result: DiagnosticResult) => {
    if (result.success) {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Sucesso</Badge>;
    } else {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Falha</Badge>;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Diagnóstico VPS - FASE 1
        </CardTitle>
        <CardDescription>
          Diagnóstico completo da conectividade e funcionalidade da VPS
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="tests" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tests">Executar Testes</TabsTrigger>
            <TabsTrigger value="results">Resultados</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tests" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Teste 1: Edge Function */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {getTestIcon('edge_function')}
                    Edge Function
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Verifica se a Edge Function está funcionando corretamente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => runDiagnostic('edge_function')}
                    disabled={loading === 'edge_function'}
                    size="sm"
                    className="w-full"
                  >
                    {loading === 'edge_function' ? 'Testando...' : 'Testar Edge Function'}
                  </Button>
                </CardContent>
              </Card>

              {/* Teste 2: Conectividade VPS */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {getTestIcon('vps_connectivity')}
                    Conectividade VPS
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Testa conectividade de rede com a VPS
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => runDiagnostic('vps_connectivity')}
                    disabled={loading === 'vps_connectivity'}
                    size="sm"
                    className="w-full"
                  >
                    {loading === 'vps_connectivity' ? 'Testando...' : 'Testar Conectividade'}
                  </Button>
                </CardContent>
              </Card>

              {/* Teste 3: Autenticação VPS */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {getTestIcon('vps_auth')}
                    Autenticação VPS
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Verifica autenticação com a API da VPS
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => runDiagnostic('vps_auth')}
                    disabled={loading === 'vps_auth'}
                    size="sm"
                    className="w-full"
                  >
                    {loading === 'vps_auth' ? 'Testando...' : 'Testar Autenticação'}
                  </Button>
                </CardContent>
              </Card>

              {/* Teste 4: Serviços VPS */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {getTestIcon('vps_services')}
                    Serviços VPS
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Testa todos os endpoints da API VPS
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => runDiagnostic('vps_services')}
                    disabled={loading === 'vps_services'}
                    size="sm"
                    className="w-full"
                  >
                    {loading === 'vps_services' ? 'Testando...' : 'Testar Serviços'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Teste Completo */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  {getTestIcon('full_flow')}
                  Fluxo Completo
                </CardTitle>
                <CardDescription className="text-xs">
                  Testa o fluxo completo via Edge Function whatsapp_web_server
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    onClick={() => runDiagnostic('full_flow', 'check_server')}
                    disabled={!!loading}
                    size="sm"
                    className="w-full"
                  >
                    {loading === 'full_flow' ? 'Testando...' : 'Testar check_server'}
                  </Button>
                  <Button 
                    onClick={() => runDiagnostic('full_flow', 'get_server_info')}
                    disabled={!!loading}
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    {loading === 'full_flow' ? 'Testando...' : 'Testar get_server_info'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {results.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum teste executado ainda. Execute alguns testes na aba anterior.
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((result, index) => (
                  <Card key={`${result.test}-${index}`} className={result.success ? 'border-green-200' : 'border-red-200'}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          {getTestIcon(result.test)}
                          {result.test.replace('_', ' ').toUpperCase()}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(result)}
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDuration(result.duration)}
                          </Badge>
                        </div>
                      </div>
                      <CardDescription className="text-xs">
                        {new Date(result.timestamp).toLocaleString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Recomendações */}
                      {result.recommendations && result.recommendations.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            Recomendações:
                          </h4>
                          <ul className="text-xs space-y-1">
                            {result.recommendations.map((rec, i) => (
                              <li key={i} className="text-yellow-700">• {rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Detalhes do teste */}
                      <details className="text-xs">
                        <summary className="cursor-pointer font-medium">Detalhes técnicos</summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
