
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2, Wifi, Server, Key, Clock } from "lucide-react";

interface APITestResults {
  token_configured: boolean;
  connectivity: boolean;
  authentication: boolean;
  vps_list_access: boolean;
  response_time?: number;
  error_details?: string;
  vps_count?: number;
}

export const HostingerAPITest = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<APITestResults | null>(null);

  const runAPITest = async () => {
    try {
      setTesting(true);
      setResults(null);
      toast.info("🔍 Testando conectividade com API Hostinger...");

      const startTime = Date.now();
      
      // Testar conectividade básica
      const response = await fetch('https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/hostinger_proxy/virtual-machines', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const data = await response.json();
      
      let testResults: APITestResults = {
        token_configured: true, // Se chegou até aqui, o token está configurado
        connectivity: response.ok,
        authentication: response.status !== 401 && response.status !== 403,
        vps_list_access: false,
        response_time: responseTime
      };

      if (data.success && data.data) {
        testResults.vps_list_access = true;
        testResults.vps_count = Array.isArray(data.data) ? data.data.length : 0;
        toast.success(`✅ Teste concluído! ${testResults.vps_count} VPS encontradas`);
      } else {
        testResults.error_details = data.error || 'Erro desconhecido';
        
        // Verificar tipos específicos de erro
        if (data.code === 'MISSING_TOKEN') {
          testResults.token_configured = false;
        } else if (response.status === 401 || response.status === 403) {
          testResults.authentication = false;
        }
        
        toast.error(`❌ Falha no teste: ${data.error}`);
      }

      setResults(testResults);

    } catch (error: any) {
      console.error('Erro no teste da API:', error);
      
      setResults({
        token_configured: false,
        connectivity: false,
        authentication: false,
        vps_list_access: false,
        error_details: error.message
      });
      
      toast.error(`❌ Erro no teste: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: boolean | undefined) => {
    if (status === undefined) return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getStatusColor = (status: boolean | undefined) => {
    if (status === undefined) return "text-gray-600";
    return status ? "text-green-600" : "text-red-600";
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-blue-800">Teste de Conectividade API</CardTitle>
          </div>
          <Button 
            onClick={runAPITest} 
            disabled={testing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Testando...
              </>
            ) : (
              <>
                <Server className="h-4 w-4 mr-2" />
                Testar API
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {!results && !testing && (
          <div className="text-center py-6 text-blue-700">
            <Wifi className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Clique em "Testar API" para verificar a conectividade com a Hostinger</p>
          </div>
        )}

        {testing && (
          <div className="text-center py-6 text-blue-700">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Testando conectividade com a API Hostinger...</p>
          </div>
        )}

        {results && (
          <div className="space-y-4">
            {/* Status Geral */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="text-2xl">🔗</div>
                <div>
                  <h3 className="font-medium">Status da Integração</h3>
                  <p className="text-sm text-muted-foreground">API Hostinger</p>
                </div>
              </div>
              {results.vps_list_access ? (
                <Badge className="bg-green-600">CONECTADO</Badge>
              ) : (
                <Badge variant="destructive">FALHA</Badge>
              )}
            </div>

            {/* Detalhes dos Testes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 border rounded">
                {getStatusIcon(results.token_configured)}
                <div>
                  <div className={`font-medium ${getStatusColor(results.token_configured)}`}>
                    Token Configurado
                  </div>
                  <div className="text-xs text-muted-foreground">HOSTINGER_API_TOKEN</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 border rounded">
                {getStatusIcon(results.connectivity)}
                <div>
                  <div className={`font-medium ${getStatusColor(results.connectivity)}`}>
                    Conectividade
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {results.response_time ? `${results.response_time}ms` : 'N/A'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 border rounded">
                {getStatusIcon(results.authentication)}
                <div>
                  <div className={`font-medium ${getStatusColor(results.authentication)}`}>
                    Autenticação
                  </div>
                  <div className="text-xs text-muted-foreground">Bearer Token</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 border rounded">
                {getStatusIcon(results.vps_list_access)}
                <div>
                  <div className={`font-medium ${getStatusColor(results.vps_list_access)}`}>
                    Acesso VPS
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {results.vps_count !== undefined ? `${results.vps_count} VPS` : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Detalhes do Erro */}
            {results.error_details && (
              <div className="p-3 bg-red-100 rounded-lg border border-red-300">
                <h4 className="font-medium text-red-800 mb-2">Detalhes do Erro:</h4>
                <p className="text-sm text-red-700">{results.error_details}</p>
              </div>
            )}

            {/* Recomendações */}
            {!results.vps_list_access && (
              <div className="p-3 bg-yellow-100 rounded-lg border border-yellow-300">
                <h4 className="font-medium text-yellow-800 mb-2">Recomendações:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {!results.token_configured && (
                    <li>• Configure o token HOSTINGER_API_TOKEN nos Supabase Secrets</li>
                  )}
                  {!results.authentication && (
                    <li>• Verifique se o token da API está válido e não expirado</li>
                  )}
                  {!results.connectivity && (
                    <li>• Verifique a conectividade de rede com api.hostinger.com</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
