
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Loader2, Wifi, Server, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  data?: any;
}

export const PortTestDiagnostic = () => {
  const [isTestingConnectivity, setIsTestingConnectivity] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const resetTests = () => {
    setTestResults([]);
  };

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const testVPSConnectivity = async () => {
    try {
      setIsTestingConnectivity(true);
      resetTests();
      toast.info('🔍 Iniciando teste de conectividade na porta 80...');

      // Teste 1: Ping básico da VPS na porta 80
      addTestResult({
        test: 'Ping VPS',
        status: 'pending',
        message: 'Testando conectividade básica...'
      });

      try {
        const pingResponse = await fetch('http://31.97.24.222/health', {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });

        if (pingResponse.ok) {
          const healthData = await pingResponse.json();
          addTestResult({
            test: 'Ping VPS',
            status: 'success',
            message: 'VPS acessível na porta 80!',
            data: healthData
          });
        } else {
          addTestResult({
            test: 'Ping VPS',
            status: 'error',
            message: `HTTP ${pingResponse.status} - Servidor não está respondendo`
          });
        }
      } catch (error: any) {
        addTestResult({
          test: 'Ping VPS',
          status: 'error',
          message: `Erro de conectividade: ${error.message}`
        });
      }

      // Teste 2: Proxy Hostinger
      addTestResult({
        test: 'Proxy Hostinger',
        status: 'pending',
        message: 'Testando proxy interno...'
      });

      try {
        const proxyResponse = await fetch('/functions/v1/hostinger_proxy/health', {
          method: 'GET',
          signal: AbortSignal.timeout(8000)
        });

        if (proxyResponse.ok) {
          const proxyData = await proxyResponse.json();
          addTestResult({
            test: 'Proxy Hostinger',
            status: 'success',
            message: 'Proxy funcionando com a porta 80!',
            data: proxyData
          });
        } else {
          addTestResult({
            test: 'Proxy Hostinger',
            status: 'error',
            message: `Proxy Error: ${proxyResponse.status}`
          });
        }
      } catch (error: any) {
        addTestResult({
          test: 'Proxy Hostinger',
          status: 'error',
          message: `Erro no proxy: ${error.message}`
        });
      }

      // Teste 3: WhatsApp Server (porta 3001)
      addTestResult({
        test: 'WhatsApp Server',
        status: 'pending',
        message: 'Testando servidor WhatsApp na porta 3001...'
      });

      try {
        const whatsappResponse = await fetch('http://31.97.24.222:3001/health', {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });

        if (whatsappResponse.ok) {
          const whatsappData = await whatsappResponse.json();
          addTestResult({
            test: 'WhatsApp Server',
            status: 'success',
            message: 'Servidor WhatsApp online!',
            data: whatsappData
          });
        } else {
          addTestResult({
            test: 'WhatsApp Server',
            status: 'error',
            message: `WhatsApp Server não está rodando (${whatsappResponse.status})`
          });
        }
      } catch (error: any) {
        addTestResult({
          test: 'WhatsApp Server',
          status: 'error',
          message: `WhatsApp Server offline: ${error.message}`
        });
      }

      toast.success('✅ Teste de conectividade concluído!');

    } catch (error: any) {
      console.error('Erro no teste:', error);
      toast.error(`❌ Erro no teste: ${error.message}`);
    } finally {
      setIsTestingConnectivity(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Sucesso</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      case 'pending':
        return <Badge variant="secondary">Testando...</Badge>;
    }
  };

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-green-600" />
            <CardTitle className="text-green-800">Teste Porta 80 Liberada</CardTitle>
          </div>
          <Badge variant="outline" className="text-green-600 border-green-600">
            ✅ Porta 80 Aberta
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-3 bg-white rounded-lg border border-green-200">
            <h4 className="font-medium text-green-800 mb-2">Status do Firewall:</h4>
            <div className="text-sm text-green-700">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Porta 80/TCP liberada via UFW
              </div>
              <div className="text-xs text-green-600 mt-1">
                Comando executado: <code>sudo ufw allow 80/tcp && sudo ufw reload</code>
              </div>
            </div>
          </div>

          {/* Botão de teste */}
          <div className="flex gap-2">
            <Button
              onClick={testVPSConnectivity}
              disabled={isTestingConnectivity}
              className="bg-green-600 hover:bg-green-700"
            >
              {isTestingConnectivity ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Testando Conectividade...
                </>
              ) : (
                <>
                  <Wifi className="h-4 w-4 mr-2" />
                  Testar Porta 80
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => window.open('http://31.97.24.222/health', '_blank')}
              className="border-green-600 text-green-600"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Testar Direto
            </Button>
          </div>

          {/* Resultados dos testes */}
          {testResults.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-green-800">Resultados dos Testes:</h4>
              {testResults.map((result, index) => (
                <div key={index} className="p-3 bg-white rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      <span className="font-medium">{result.test}</span>
                    </div>
                    {getStatusBadge(result.status)}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                  {result.data && (
                    <div className="text-xs bg-gray-100 p-2 rounded">
                      <pre>{JSON.stringify(result.data, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Próximos passos */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">Próximos Passos:</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <div>1. ✅ Porta 80 liberada no firewall</div>
              <div>2. 🔍 Testar conectividade HTTP</div>
              <div>3. 🚀 Executar deploy se necessário</div>
              <div>4. ✨ Verificar servidores online</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
