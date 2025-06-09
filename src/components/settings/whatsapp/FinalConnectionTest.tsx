
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  QrCode,
  MessageSquare,
  Zap,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

interface TestStep {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  details?: any;
}

export const FinalConnectionTest = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<TestStep[]>([
    { id: 'server', title: 'Verificar Servidor VPS', status: 'pending' },
    { id: 'create', title: 'Criar Instância WhatsApp', status: 'pending' },
    { id: 'qr', title: 'Gerar QR Code', status: 'pending' },
    { id: 'connect', title: 'Aguardar Conexão', status: 'pending' },
    { id: 'test', title: 'Testar Envio', status: 'pending' },
    { id: 'persist', title: 'Validar Persistência', status: 'pending' }
  ]);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connectionDetails, setConnectionDetails] = useState<any>(null);

  const updateStep = (stepId: string, status: TestStep['status'], message?: string, details?: any) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, message, details }
        : step
    ));
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const runFinalTest = async () => {
    setIsRunning(true);
    setQrCode(null);
    setConnectionDetails(null);
    
    // Reset all steps
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending', message: undefined })));

    try {
      // Step 1: Verificar servidor
      updateStep('server', 'running', 'Verificando servidor VPS...');
      
      const healthResponse = await fetch('http://31.97.24.222:3002/health');
      const healthData = await healthResponse.json();
      
      if (healthData.success) {
        updateStep('server', 'success', 'Servidor online e funcional', healthData);
        toast.success('✅ Servidor VPS validado');
      } else {
        throw new Error('Servidor não está respondendo corretamente');
      }

      await sleep(1000);

      // Step 2: Criar instância
      updateStep('create', 'running', 'Criando instância WhatsApp...');
      
      const instanceName = `teste_final_${Date.now()}`;
      const createResponse = await fetch('http://31.97.24.222:3002/instance/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3'
        },
        body: JSON.stringify({
          instanceId: instanceName,
          sessionName: instanceName,
          webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web'
        })
      });

      const createData = await createResponse.json();
      
      if (createData.success) {
        updateStep('create', 'success', `Instância ${instanceName} criada`, createData);
        toast.success('✅ Instância WhatsApp criada');
      } else {
        throw new Error(createData.error || 'Falha ao criar instância');
      }

      await sleep(2000);

      // Step 3: Obter QR Code
      updateStep('qr', 'running', 'Aguardando QR Code...');
      
      let qrAttempts = 0;
      const maxQrAttempts = 12;
      let qrFound = false;

      while (qrAttempts < maxQrAttempts && !qrFound) {
        qrAttempts++;
        updateStep('qr', 'running', `Tentativa ${qrAttempts}/${maxQrAttempts} para obter QR...`);

        const qrResponse = await fetch('http://31.97.24.222:3002/instance/qr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3'
          },
          body: JSON.stringify({ instanceId: instanceName })
        });

        const qrData = await qrResponse.json();

        if (qrData.success && qrData.qrCode) {
          setQrCode(qrData.qrCode);
          updateStep('qr', 'success', 'QR Code gerado! Escaneie com seu WhatsApp', qrData);
          toast.success('📱 QR Code pronto para escaneamento!');
          qrFound = true;
          break;
        }

        await sleep(5000);
      }

      if (!qrFound) {
        throw new Error('Timeout: QR Code não foi gerado');
      }

      // Step 4: Aguardar conexão
      updateStep('connect', 'running', 'Aguardando você escanear o QR Code...');
      toast.info('📱 Escaneie o QR Code no seu WhatsApp para continuar');

      let connectionAttempts = 0;
      const maxConnectionAttempts = 24; // 2 minutos
      let connected = false;

      while (connectionAttempts < maxConnectionAttempts && !connected) {
        connectionAttempts++;
        updateStep('connect', 'running', `Verificando conexão (${connectionAttempts}/${maxConnectionAttempts})...`);

        const statusResponse = await fetch(`http://31.97.24.222:3002/instance/${instanceName}/status`, {
          headers: {
            'Authorization': 'Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3'
          }
        });

        const statusData = await statusResponse.json();

        if (statusData.success) {
          const status = statusData.status;
          
          if (status === 'ready' || status === 'open' || status === 'connected') {
            setConnectionDetails(statusData);
            updateStep('connect', 'success', `WhatsApp conectado! ${statusData.phone || ''}`, statusData);
            toast.success('🎉 WhatsApp conectado com sucesso!');
            connected = true;
            break;
          }
        }

        await sleep(5000);
      }

      if (!connected) {
        throw new Error('Timeout: WhatsApp não foi conectado em 2 minutos');
      }

      // Step 5: Testar envio
      updateStep('test', 'running', 'Testando envio de mensagem...');

      if (connectionDetails?.phone) {
        const sendResponse = await fetch('http://31.97.24.222:3002/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3'
          },
          body: JSON.stringify({
            instanceId: instanceName,
            phone: connectionDetails.phone,
            message: `🤖 Teste automático - ${new Date().toLocaleString()}`
          })
        });

        const sendData = await sendResponse.json();

        if (sendData.success) {
          updateStep('test', 'success', 'Mensagem de teste enviada!', sendData);
          toast.success('📤 Mensagem de teste enviada!');
        } else {
          updateStep('test', 'error', sendData.error || 'Falha no envio');
        }
      } else {
        updateStep('test', 'error', 'Número não disponível para teste');
      }

      // Step 6: Validar persistência
      updateStep('persist', 'running', 'Validando persistência...');

      const instancesResponse = await fetch('http://31.97.24.222:3002/instances', {
        headers: {
          'Authorization': 'Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3'
        }
      });

      const instancesData = await instancesResponse.json();

      if (instancesData.success && instancesData.instances.some((i: any) => i.instanceId === instanceName)) {
        updateStep('persist', 'success', 'Instância persistida com sucesso!', instancesData);
        toast.success('💾 Persistência validada!');
      } else {
        updateStep('persist', 'error', 'Instância não encontrada na lista');
      }

    } catch (error: any) {
      console.error('Erro no teste final:', error);
      toast.error(`Erro: ${error.message}`);
      
      // Marcar step atual como erro
      const currentStep = steps.find(s => s.status === 'running');
      if (currentStep) {
        updateStep(currentStep.id, 'error', error.message);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const getStepIcon = (step: TestStep) => {
    switch (step.status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-2 w-2 bg-gray-300 rounded-full" />;
    }
  };

  const getStepBadge = (status: TestStep['status']) => {
    switch (status) {
      case 'running':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Executando</Badge>;
      case 'success':
        return <Badge variant="outline" className="text-green-600 border-green-600">Sucesso</Badge>;
      case 'error':
        return <Badge variant="outline" className="text-red-600 border-red-600">Erro</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-600 border-gray-600">Pendente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-blue-800">Teste Final - Conectar WhatsApp</CardTitle>
            </div>
            <Button 
              onClick={runFinalTest}
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar Teste
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-700">
            Este teste vai criar uma instância WhatsApp na VPS, gerar QR Code, aguardar conexão 
            e validar toda a integração end-to-end.
          </p>
        </CardContent>
      </Card>

      {/* Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Progresso do Teste
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-start gap-4 p-3 rounded-lg border">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-sm font-medium text-gray-500">
                    {index + 1}.
                  </span>
                  {getStepIcon(step)}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{step.title}</h4>
                      {getStepBadge(step.status)}
                    </div>
                    {step.message && (
                      <p className="text-sm text-muted-foreground">{step.message}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* QR Code Display */}
      {qrCode && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-800">QR Code WhatsApp</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-center">
            <div className="bg-white p-4 rounded-lg border-2 border-green-200 inline-block mb-4">
              <img 
                src={qrCode} 
                alt="QR Code WhatsApp" 
                className="w-64 h-64 object-contain"
              />
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Como conectar:</h4>
              <ol className="text-sm text-blue-700 text-left space-y-1">
                <li>1. Abra o WhatsApp no seu celular</li>
                <li>2. Vá em Menu → Aparelhos conectados</li>
                <li>3. Toque em "Conectar um aparelho"</li>
                <li>4. Escaneie este QR code</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection Details */}
      {connectionDetails && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-800">WhatsApp Conectado!</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-green-800">Telefone:</p>
                <p className="text-sm text-green-700">{connectionDetails.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">Perfil:</p>
                <p className="text-sm text-green-700">{connectionDetails.profileName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">Status:</p>
                <p className="text-sm text-green-700">{connectionDetails.status}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">Instância:</p>
                <p className="text-sm text-green-700">{connectionDetails.instanceId}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      {connectionDetails && (
        <Card>
          <CardHeader>
            <CardTitle>🎉 Próximos Passos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>✅ <strong>WhatsApp conectado com sucesso!</strong></p>
              <p>• Acesse <strong>/whatsapp-chat</strong> para começar a enviar mensagens</p>
              <p>• A instância ficará ativa permanentemente na VPS</p>
              <p>• O sistema vai reconectar automaticamente se houver queda</p>
              <p>• Use <strong>/settings</strong> para gerenciar suas instâncias</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
