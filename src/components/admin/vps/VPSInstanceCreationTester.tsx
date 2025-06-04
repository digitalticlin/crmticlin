
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  MessageSquare, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Play,
  Trash2,
  QrCode
} from "lucide-react";

interface InstanceTestResult {
  step: string;
  success: boolean;
  duration: number;
  details?: any;
  error?: string;
  timestamp: string;
}

export const VPSInstanceCreationTester = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testInstanceName, setTestInstanceName] = useState('');
  const [testResults, setTestResults] = useState<InstanceTestResult[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [createdInstanceId, setCreatedInstanceId] = useState<string | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[Instance Creation Test] ${message}`);
  };

  const updateTestResult = (step: string, updates: Partial<InstanceTestResult>) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.step === step);
      if (existing) {
        return prev.map(r => r.step === step ? { ...r, ...updates } : r);
      } else {
        return [...prev, { step, success: false, duration: 0, timestamp: new Date().toISOString(), ...updates }];
      }
    });
  };

  const runInstanceCreationTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    setLogs([]);
    setCreatedInstanceId(null);

    const instanceName = testInstanceName || `test_instance_${Date.now()}`;
    
    try {
      addLog(`🚀 Iniciando teste de criação de instância: ${instanceName}`);

      // PASSO 1: Testar conectividade VPS
      addLog("🔍 PASSO 1: Testando conectividade VPS...");
      const step1Start = Date.now();
      
      try {
        const { data: connectivityData, error: connectivityError } = await supabase.functions.invoke('vps_diagnostic', {
          body: { test: 'vps_connectivity' }
        });

        const step1Duration = Date.now() - step1Start;

        if (connectivityError || !connectivityData.success) {
          throw new Error(connectivityData?.error || connectivityError?.message || 'Conectividade falhou');
        }

        updateTestResult('vps_connectivity', {
          success: true,
          duration: step1Duration,
          details: connectivityData.details,
          timestamp: new Date().toISOString()
        });
        addLog("✅ PASSO 1: VPS acessível");

      } catch (error: any) {
        const step1Duration = Date.now() - step1Start;
        updateTestResult('vps_connectivity', {
          success: false,
          duration: step1Duration,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        addLog(`❌ PASSO 1: ${error.message}`);
        throw error;
      }

      // PASSO 2: Testar autenticação VPS
      addLog("🔐 PASSO 2: Testando autenticação VPS...");
      const step2Start = Date.now();
      
      try {
        const { data: authData, error: authError } = await supabase.functions.invoke('vps_diagnostic', {
          body: { test: 'vps_auth' }
        });

        const step2Duration = Date.now() - step2Start;

        if (authError || !authData.success) {
          throw new Error(authData?.error || authError?.message || 'Autenticação falhou');
        }

        updateTestResult('vps_authentication', {
          success: true,
          duration: step2Duration,
          details: authData.details,
          timestamp: new Date().toISOString()
        });
        addLog("✅ PASSO 2: Autenticação OK");

      } catch (error: any) {
        const step2Duration = Date.now() - step2Start;
        updateTestResult('vps_authentication', {
          success: false,
          duration: step2Duration,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        addLog(`❌ PASSO 2: ${error.message}`);
        throw error;
      }

      // PASSO 3: Criar instância WhatsApp
      addLog(`📱 PASSO 3: Criando instância WhatsApp: ${instanceName}...`);
      const step3Start = Date.now();
      
      try {
        const { data: createData, error: createError } = await supabase.functions.invoke('whatsapp_web_server', {
          body: { 
            action: 'create_instance',
            instanceData: { instanceName }
          }
        });

        const step3Duration = Date.now() - step3Start;

        if (createError || !createData.success) {
          throw new Error(createData?.error || createError?.message || 'Criação de instância falhou');
        }

        const instanceId = createData.instance?.id || createData.instance?.instanceId;
        setCreatedInstanceId(instanceId);

        updateTestResult('instance_creation', {
          success: true,
          duration: step3Duration,
          details: createData,
          timestamp: new Date().toISOString()
        });
        addLog(`✅ PASSO 3: Instância criada com sucesso - ID: ${instanceId}`);

        // PASSO 4: Obter QR Code
        if (instanceId) {
          addLog("📱 PASSO 4: Obtendo QR Code...");
          const step4Start = Date.now();
          
          try {
            const { data: qrData, error: qrError } = await supabase.functions.invoke('whatsapp_web_server', {
              body: { 
                action: 'get_qr_code',
                instanceData: { instanceId }
              }
            });

            const step4Duration = Date.now() - step4Start;

            if (qrError || !qrData.success) {
              throw new Error(qrData?.error || qrError?.message || 'Falha ao obter QR Code');
            }

            updateTestResult('qr_code_generation', {
              success: true,
              duration: step4Duration,
              details: { hasQrCode: !!qrData.qrCode, qrCodeLength: qrData.qrCode?.length },
              timestamp: new Date().toISOString()
            });
            addLog("✅ PASSO 4: QR Code gerado com sucesso");

          } catch (error: any) {
            const step4Duration = Date.now() - step4Start;
            updateTestResult('qr_code_generation', {
              success: false,
              duration: step4Duration,
              error: error.message,
              timestamp: new Date().toISOString()
            });
            addLog(`⚠️ PASSO 4: ${error.message}`);
            // Não quebrar o teste por erro de QR Code
          }
        }

      } catch (error: any) {
        const step3Duration = Date.now() - step3Start;
        updateTestResult('instance_creation', {
          success: false,
          duration: step3Duration,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        addLog(`❌ PASSO 3: ${error.message}`);
        throw error;
      }

      addLog("🎉 Teste de criação de instância concluído com sucesso!");
      toast.success("Teste de instância concluído com sucesso!");

    } catch (error: any) {
      addLog(`💥 Teste falhou: ${error.message}`);
      toast.error(`Teste de instância falhou: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const cleanupTestInstance = async () => {
    if (!createdInstanceId) {
      toast.error('Nenhuma instância de teste para limpar');
      return;
    }

    try {
      addLog(`🧹 Removendo instância de teste: ${createdInstanceId}`);
      
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: { 
          action: 'delete_instance',
          instanceData: { instanceId: createdInstanceId }
        }
      });

      if (error || !data.success) {
        throw new Error(data?.error || error?.message || 'Falha ao remover instância');
      }

      addLog("✅ Instância de teste removida com sucesso");
      toast.success("Instância de teste removida");
      setCreatedInstanceId(null);

    } catch (error: any) {
      addLog(`❌ Erro ao remover instância: ${error.message}`);
      toast.error(`Erro ao remover instância: ${error.message}`);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? "default" : "destructive"}>
        {success ? 'SUCESSO' : 'FALHA'}
      </Badge>
    );
  };

  const getStepTitle = (step: string) => {
    const titles = {
      vps_connectivity: 'Conectividade VPS',
      vps_authentication: 'Autenticação VPS',
      instance_creation: 'Criação de Instância',
      qr_code_generation: 'Geração de QR Code'
    };
    return titles[step as keyof typeof titles] || step;
  };

  return (
    <div className="space-y-6">
      {/* Controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5 text-purple-600" />
            Teste de Criação de Instância WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <MessageSquare className="h-4 w-4" />
            <AlertDescription>
              Este teste verifica todo o fluxo de criação de instância WhatsApp: conectividade, 
              autenticação, criação e geração de QR Code.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="testInstanceName">Nome da Instância de Teste (opcional)</Label>
            <Input
              id="testInstanceName"
              value={testInstanceName}
              onChange={(e) => setTestInstanceName(e.target.value)}
              placeholder="Ex: teste_instancia_001"
            />
            <p className="text-xs text-muted-foreground">
              Se vazio, será gerado automaticamente
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={runInstanceCreationTest}
              disabled={isRunning}
              className="flex-1"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Executando Teste...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Executar Teste Completo
                </>
              )}
            </Button>

            {createdInstanceId && (
              <Button 
                onClick={cleanupTestInstance}
                variant="outline"
                disabled={isRunning}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Teste
              </Button>
            )}
          </div>

          {createdInstanceId && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <strong>Instância de teste criada:</strong> {createdInstanceId}
                <br />
                <small>Lembre-se de remover após o teste</small>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Resultados dos Testes */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-green-600" />
              Resultados do Teste
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {testResults.map((result, index) => (
              <div key={result.step} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.success)}
                    <span className="font-medium">
                      {index + 1}. {getStepTitle(result.step)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(result.success)}
                    <span className="text-xs text-muted-foreground">
                      {result.duration}ms
                    </span>
                  </div>
                </div>
                
                {result.details && (
                  <details className="text-xs mt-2">
                    <summary className="cursor-pointer text-muted-foreground">
                      Ver detalhes técnicos
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded overflow-auto max-h-32">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}

                {result.error && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    <strong>Erro:</strong> {result.error}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Logs */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Logs de Execução</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-40 w-full">
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="text-xs font-mono bg-black/5 p-2 rounded">
                    {log}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
