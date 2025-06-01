
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Server, 
  Wifi, 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Terminal,
  Globe,
  Layers
} from "lucide-react";
import { toast } from "sonner";

interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: any;
  duration?: number;
}

const VPS_CONFIG = {
  host: '31.97.24.222',
  port: 3001,
  baseUrl: 'http://31.97.24.222:3001'
};

export const VPSDiagnosticPanel = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');

  const updateResult = (test: string, status: DiagnosticResult['status'], message: string, details?: any, duration?: number) => {
    setResults(prev => {
      const existing = prev.findIndex(r => r.test === test);
      const newResult = { test, status, message, details, duration };
      
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newResult;
        return updated;
      }
      return [...prev, newResult];
    });
  };

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setCurrentTest(testName);
    updateResult(testName, 'pending', 'Executando...');
    
    const startTime = Date.now();
    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      updateResult(testName, 'success', 'Sucesso', result, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      updateResult(testName, 'error', error instanceof Error ? error.message : 'Erro desconhecido', error, duration);
      throw error;
    }
  };

  const runAllDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);
    
    try {
      // 1. Teste de Conectividade Básica
      await runTest('Conectividade VPS', async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        
        try {
          const response = await fetch(`${VPS_CONFIG.baseUrl}/health`, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json'
            }
          });
          clearTimeout(timeout);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          return { status: response.status, data };
        } catch (error) {
          clearTimeout(timeout);
          throw error;
        }
      });

      // 2. Teste de Estrutura de Diretórios
      await runTest('Estrutura de Diretórios', async () => {
        const response = await fetch(`${VPS_CONFIG.baseUrl}/debug/structure`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          throw new Error(`Endpoint não disponível: ${response.status}`);
        }
        
        return await response.json();
      });

      // 3. Teste de Dependências Node.js
      await runTest('Dependências Node.js', async () => {
        const response = await fetch(`${VPS_CONFIG.baseUrl}/debug/dependencies`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          throw new Error(`Endpoint não disponível: ${response.status}`);
        }
        
        return await response.json();
      });

      // 4. Teste de Configuração WhatsApp Web.js
      await runTest('Configuração WhatsApp Web.js', async () => {
        const response = await fetch(`${VPS_CONFIG.baseUrl}/debug/whatsapp-config`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          throw new Error(`Endpoint não disponível: ${response.status}`);
        }
        
        return await response.json();
      });

      // 5. Teste de Persistência de Sessão
      await runTest('Persistência de Sessão', async () => {
        const response = await fetch(`${VPS_CONFIG.baseUrl}/debug/session-config`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          throw new Error(`Endpoint não disponível: ${response.status}`);
        }
        
        return await response.json();
      });

      // 6. Teste de Lista de Instâncias Ativas
      await runTest('Lista de Instâncias Ativas', async () => {
        const response = await fetch(`${VPS_CONFIG.baseUrl}/instances`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
      });

      // 7. Teste de Criação de Instância (simulação)
      await runTest('Teste de Criação de Instância', async () => {
        const testInstanceId = `test_${Date.now()}`;
        
        const createResponse = await fetch(`${VPS_CONFIG.baseUrl}/test-create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instanceId: testInstanceId,
            testMode: true
          })
        });
        
        if (!createResponse.ok) {
          throw new Error(`Falha na criação: ${createResponse.status}`);
        }
        
        const createData = await createResponse.json();
        
        // Verificar se a instância foi criada
        const verifyResponse = await fetch(`${VPS_CONFIG.baseUrl}/status/${testInstanceId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const verifyData = verifyResponse.ok ? await verifyResponse.json() : null;
        
        return {
          creation: createData,
          verification: verifyData,
          persistent: !!verifyData
        };
      });

      // 8. Teste de Webhook
      await runTest('Configuração de Webhook', async () => {
        const response = await fetch(`${VPS_CONFIG.baseUrl}/debug/webhook-config`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          throw new Error(`Endpoint não disponível: ${response.status}`);
        }
        
        return await response.json();
      });

      // 9. Teste de Logs do Sistema
      await runTest('Logs do Sistema', async () => {
        const response = await fetch(`${VPS_CONFIG.baseUrl}/debug/logs`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          throw new Error(`Logs não disponíveis: ${response.status}`);
        }
        
        return await response.json();
      });

      // 10. Teste de Recursos do Sistema
      await runTest('Recursos do Sistema', async () => {
        const response = await fetch(`${VPS_CONFIG.baseUrl}/debug/system-resources`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          throw new Error(`Recursos não disponíveis: ${response.status}`);
        }
        
        return await response.json();
      });

      toast.success("Diagnóstico completo executado!");
      
    } catch (error) {
      console.error('Erro no diagnóstico:', error);
      toast.error("Erro durante o diagnóstico");
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'pending':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    const variants = {
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-blue-100 text-blue-800'
    };
    
    return variants[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-blue-600" />
            Diagnóstico Completo da VPS
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Execute testes completos para identificar problemas de configuração na VPS Node.js
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <Server className="h-4 w-4" />
            <AlertDescription>
              <strong>VPS Target:</strong> {VPS_CONFIG.host}:{VPS_CONFIG.port}
              <br />
              Este diagnóstico irá testar todos os aspectos críticos da configuração.
            </AlertDescription>
          </Alert>

          <Button 
            onClick={runAllDiagnostics} 
            disabled={isRunning}
            className="w-full"
            size="lg"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Executando Diagnóstico... {currentTest && `(${currentTest})`}
              </>
            ) : (
              <>
                <Terminal className="h-4 w-4 mr-2" />
                Executar Diagnóstico Completo
              </>
            )}
          </Button>

          {results.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium">Resultados dos Testes:</h3>
              
              {results.map((result, index) => (
                <Card key={index} className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      <span className="font-medium">{result.test}</span>
                      {result.duration && (
                        <span className="text-xs text-muted-foreground">
                          ({result.duration}ms)
                        </span>
                      )}
                    </div>
                    <Badge className={getStatusBadge(result.status)}>
                      {result.status}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {result.message}
                  </p>
                  
                  {result.details && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                        Ver detalhes
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo dos Resultados */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-green-600" />
              Resumo do Diagnóstico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-green-50 rounded">
                <div className="text-2xl font-bold text-green-600">
                  {results.filter(r => r.status === 'success').length}
                </div>
                <div className="text-sm text-green-700">Sucessos</div>
              </div>
              <div className="p-3 bg-red-50 rounded">
                <div className="text-2xl font-bold text-red-600">
                  {results.filter(r => r.status === 'error').length}
                </div>
                <div className="text-sm text-red-700">Erros</div>
              </div>
              <div className="p-3 bg-yellow-50 rounded">
                <div className="text-2xl font-bold text-yellow-600">
                  {results.filter(r => r.status === 'warning').length}
                </div>
                <div className="text-sm text-yellow-700">Avisos</div>
              </div>
              <div className="p-3 bg-blue-50 rounded">
                <div className="text-2xl font-bold text-blue-600">
                  {results.filter(r => r.status === 'pending').length}
                </div>
                <div className="text-sm text-blue-700">Pendentes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
