
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface TestResult {
  endpoint: string;
  success: boolean;
  responseTime?: number;
  error?: string;
  data?: any;
}

export const VPSConnectivityTest = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const VPS_BASE_URL = "http://31.97.24.222:3001"; // CORRIGIDO PARA PORTA 3001
  const AUTH_TOKEN = "default-token";

  const testEndpoints = [
    {
      name: "Health Check",
      method: "GET",
      endpoint: "/health",
      description: "Verifica se o servidor está online"
    },
    {
      name: "List Instances",
      method: "GET", 
      endpoint: "/instances",
      description: "Lista todas as instâncias ativas"
    },
    {
      name: "Create Test Instance",
      method: "POST",
      endpoint: "/instance/create",
      description: "Cria uma instância de teste",
      body: {
        instanceId: `connectivity_test_${Date.now()}`,
        sessionName: "connectivity_test",
        webhookUrl: "https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web",
        companyId: "test",
        webhook: true,
        webhook_by_events: true,
        webhookEvents: ["messages.upsert", "qr.update", "connection.update"]
      }
    }
  ];

  const runConnectivityTest = async () => {
    setIsRunning(true);
    setResults([]);
    
    toast.info("Iniciando teste de conectividade VPS (porta 3001)...");

    for (const test of testEndpoints) {
      try {
        const startTime = Date.now();
        
        const response = await fetch(`${VPS_BASE_URL}${test.endpoint}`, {
          method: test.method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AUTH_TOKEN}`
          },
          body: test.body ? JSON.stringify(test.body) : undefined,
          signal: AbortSignal.timeout(15000) // 15 segundos timeout
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        let data;
        try {
          data = await response.json();
        } catch {
          data = await response.text();
        }

        const result: TestResult = {
          endpoint: `${test.method} ${test.endpoint}`,
          success: response.ok,
          responseTime,
          data: response.ok ? data : undefined,
          error: !response.ok ? `HTTP ${response.status}: ${data}` : undefined
        };

        setResults(prev => [...prev, result]);

        if (response.ok) {
          console.log(`✅ ${test.name} - Sucesso (${responseTime}ms):`, data);
        } else {
          console.error(`❌ ${test.name} - Falhou (${responseTime}ms):`, data);
        }

        // Pequena pausa entre testes
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error: any) {
        const result: TestResult = {
          endpoint: `${test.method} ${test.endpoint}`,
          success: false,
          error: error.message
        };

        setResults(prev => [...prev, result]);
        console.error(`❌ ${test.name} - Erro:`, error);
      }
    }

    setIsRunning(false);
    toast.success("Teste de conectividade concluído!");
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    );
  };

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? "default" : "destructive"}>
        {success ? "Sucesso" : "Falha"}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          Teste de Conectividade VPS (Porta 3001)
        </CardTitle>
        <p className="text-sm text-gray-600">
          Testa a conectividade direta com o servidor VPS na porta correta
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Servidor VPS:</p>
            <p className="text-sm text-gray-600">{VPS_BASE_URL}</p>
          </div>
          
          <Button 
            onClick={runConnectivityTest} 
            disabled={isRunning}
            className="min-w-32"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Testando...
              </>
            ) : (
              "Executar Teste"
            )}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-3 border-t pt-4">
            <h4 className="font-medium">Resultados dos Testes:</h4>
            
            {results.map((result, index) => (
              <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                <div className="flex items-start gap-3">
                  {getStatusIcon(result.success)}
                  <div>
                    <p className="font-medium text-sm">{result.endpoint}</p>
                    {result.responseTime && (
                      <p className="text-xs text-gray-500">
                        Tempo de resposta: {result.responseTime}ms
                      </p>
                    )}
                    {result.error && (
                      <p className="text-xs text-red-600 mt-1">{result.error}</p>
                    )}
                    {result.data && result.success && (
                      <details className="mt-2">
                        <summary className="text-xs text-blue-600 cursor-pointer">
                          Ver resposta
                        </summary>
                        <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto max-h-32">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
                {getStatusBadge(result.success)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
