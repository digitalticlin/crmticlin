
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Zap,
  Database,
  Server,
  QrCode,
  RefreshCw,
  MessageCircle,
  Download
} from "lucide-react";
import { InstanceCreationTest } from "./tests/InstanceCreationTest";
import { InstanceExistenceTest } from "./tests/InstanceExistenceTest";
import { QRCodeGenerationTest } from "./tests/QRCodeGenerationTest";
import { StatusUpdateTest } from "./tests/StatusUpdateTest";
import { MessageTest } from "./tests/MessageTest";
import { IntegratedFlowTest } from "./tests/IntegratedFlowTest";

type TestStatus = 'idle' | 'running' | 'success' | 'error' | 'warning';

interface TestResult {
  status: TestStatus;
  message: string;
  details?: any;
  timestamp?: string;
}

export const WhatsAppTestPanel = () => {
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [isRunningAll, setIsRunningAll] = useState(false);

  const updateTestResult = (testId: string, result: TestResult) => {
    setTestResults(prev => ({
      ...prev,
      [testId]: {
        ...result,
        timestamp: new Date().toLocaleString('pt-BR')
      }
    }));
  };

  const getStatusIcon = (status: TestStatus) => {
    switch (status) {
      case 'running':
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestStatus) => {
    switch (status) {
      case 'running':
        return <Badge variant="secondary">Executando</Badge>;
      case 'success':
        return <Badge className="bg-green-600">Sucesso</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Aviso</Badge>;
      default:
        return <Badge variant="outline">Aguardando</Badge>;
    }
  };

  const runAllTests = async () => {
    setIsRunningAll(true);
    
    const tests = [
      'instance-creation',
      'instance-existence', 
      'qr-generation',
      'status-update',
      'message-test',
      'integrated-flow'
    ];

    for (const testId of tests) {
      updateTestResult(testId, {
        status: 'running',
        message: 'Executando teste...'
      });
      
      // Simular delay entre testes
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setIsRunningAll(false);
  };

  const resetAllTests = () => {
    setTestResults({});
  };

  const exportResults = () => {
    const results = {
      timestamp: new Date().toISOString(),
      tests: testResults
    };
    
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whatsapp-test-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tests = [
    {
      id: 'instance-creation',
      title: 'Criação de Instância',
      description: 'Testa criação de instância no Supabase e VPS',
      icon: Database,
      component: InstanceCreationTest
    },
    {
      id: 'instance-existence',
      title: 'Verificação de Existência',
      description: 'Verifica sincronização entre Supabase e VPS',
      icon: Server,
      component: InstanceExistenceTest
    },
    {
      id: 'qr-generation',
      title: 'Geração de QR Code',
      description: 'Testa geração e salvamento de QR Code',
      icon: QrCode,
      component: QRCodeGenerationTest
    },
    {
      id: 'status-update',
      title: 'Atualização de Status',
      description: 'Testa webhook de atualização de status',
      icon: RefreshCw,
      component: StatusUpdateTest
    },
    {
      id: 'message-test',
      title: 'Envio/Recebimento',
      description: 'Testa envio e recebimento de mensagens',
      icon: MessageCircle,
      component: MessageTest
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="h-6 w-6 text-green-600" />
              <div>
                <CardTitle>Centro de Testes WhatsApp</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Validação completa do sistema antes da aplicação em produção
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetAllTests}>
                Limpar Resultados
              </Button>
              <Button variant="outline" onClick={exportResults} className="gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
              <Button 
                onClick={runAllTests} 
                disabled={isRunningAll}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                {isRunningAll ? 'Executando...' : 'Testar Tudo'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Individual Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tests.map((test) => {
          const TestComponent = test.component;
          const result = testResults[test.id];
          const IconComponent = test.icon;
          
          return (
            <Card key={test.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <IconComponent className="h-5 w-5 text-blue-600" />
                    <div>
                      <CardTitle className="text-lg">{test.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {test.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result?.status || 'idle')}
                    {getStatusBadge(result?.status || 'idle')}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <TestComponent 
                  onResult={(result: TestResult) => updateTestResult(test.id, result)}
                />
                
                {result && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Resultado:</span>
                      <span className="text-xs text-muted-foreground">
                        {result.timestamp}
                      </span>
                    </div>
                    <p className="text-sm">{result.message}</p>
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-xs cursor-pointer text-blue-600">
                          Ver detalhes
                        </summary>
                        <pre className="text-xs mt-2 p-2 bg-white rounded border overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Integrated Flow Test */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-purple-600" />
            <div>
              <CardTitle>Teste de Fluxo Integrado</CardTitle>
              <p className="text-sm text-muted-foreground">
                Executa todos os testes em sequência para validar o fluxo completo
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <IntegratedFlowTest 
            onResult={(result: TestResult) => updateTestResult('integrated-flow', result)}
          />
          
          {testResults['integrated-flow'] && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Resultado do Fluxo Completo:</span>
                <span className="text-sm text-muted-foreground">
                  {testResults['integrated-flow'].timestamp}
                </span>
              </div>
              <p className="text-sm mb-2">{testResults['integrated-flow'].message}</p>
              {testResults['integrated-flow'].details && (
                <details>
                  <summary className="text-sm cursor-pointer text-blue-600">
                    Ver relatório completo
                  </summary>
                  <pre className="text-xs mt-2 p-3 bg-white rounded border overflow-auto max-h-96">
                    {JSON.stringify(testResults['integrated-flow'].details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
