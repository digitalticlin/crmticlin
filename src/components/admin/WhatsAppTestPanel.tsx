
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  MessageSquare, 
  Phone, 
  Send, 
  QrCode, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Zap,
  Database,
  Globe
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TestResult {
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: any;
  timestamp: string;
}

export const WhatsAppTestPanel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [instanceName, setInstanceName] = useState('test_instance');
  const [testPhone, setTestPhone] = useState('5511999999999');
  const [testMessage, setTestMessage] = useState('Mensagem de teste do sistema');
  const [selectedInstanceId, setSelectedInstanceId] = useState('');
  const [vpsStatus, setVpsStatus] = useState<any>(null);

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [result, ...prev]);
  };

  // Teste 1: Verificar conectividade com VPS
  const testVPSConnection = async () => {
    setIsLoading(true);
    const startTime = new Date().toISOString();
    
    try {
      console.log('[WhatsApp Test] 🔍 Testando conectividade VPS...');
      
      const response = await fetch('http://31.97.24.222:3001/health', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer default-token'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVpsStatus(data);
        
        addTestResult({
          status: 'success',
          message: 'VPS está online e respondendo',
          details: data,
          timestamp: startTime
        });
      } else {
        throw new Error(`VPS retornou status ${response.status}`);
      }
    } catch (error: any) {
      addTestResult({
        status: 'error',
        message: `Erro na conectividade VPS: ${error.message}`,
        timestamp: startTime
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Teste 2: Criar instância de teste
  const testCreateInstance = async () => {
    setIsLoading(true);
    const startTime = new Date().toISOString();
    
    try {
      console.log('[WhatsApp Test] 🆕 Testando criação de instância...');
      
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'create_instance',
          instanceData: {
            instanceName: instanceName
          }
        }
      });

      if (error) throw error;

      if (data.success) {
        setSelectedInstanceId(data.instance.id);
        
        addTestResult({
          status: 'success',
          message: `Instância "${instanceName}" criada com sucesso`,
          details: {
            instanceId: data.instance.id,
            vpsInstanceId: data.vpsInstanceId,
            qrCode: !!data.qrCode
          },
          timestamp: startTime
        });
      } else {
        throw new Error(data.error || 'Falha na criação');
      }
    } catch (error: any) {
      addTestResult({
        status: 'error',
        message: `Erro na criação de instância: ${error.message}`,
        timestamp: startTime
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Teste 3: Verificar QR Code
  const testQRCode = async () => {
    if (!selectedInstanceId) {
      toast.error('Selecione uma instância primeiro');
      return;
    }

    setIsLoading(true);
    const startTime = new Date().toISOString();
    
    try {
      console.log('[WhatsApp Test] 📱 Testando QR Code...');
      
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'get_qr_code_async',
          instanceData: {
            instanceId: selectedInstanceId
          }
        }
      });

      if (error) throw error;

      if (data.success && data.qrCode) {
        addTestResult({
          status: 'success',
          message: 'QR Code obtido com sucesso',
          details: {
            hasQRCode: true,
            qrLength: data.qrCode.length
          },
          timestamp: startTime
        });
      } else if (data.waiting) {
        addTestResult({
          status: 'warning',
          message: 'QR Code ainda sendo gerado',
          timestamp: startTime
        });
      } else {
        throw new Error(data.error || 'QR Code não disponível');
      }
    } catch (error: any) {
      addTestResult({
        status: 'error',
        message: `Erro no QR Code: ${error.message}`,
        timestamp: startTime
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Teste 4: Enviar mensagem de teste
  const testSendMessage = async () => {
    if (!selectedInstanceId) {
      toast.error('Selecione uma instância primeiro');
      return;
    }

    setIsLoading(true);
    const startTime = new Date().toISOString();
    
    try {
      console.log('[WhatsApp Test] 📤 Testando envio de mensagem...');
      
      // Importar dinamicamente o serviço
      const { MessageSendingService } = await import('@/services/whatsapp/services/messageSendingService');
      
      const result = await MessageSendingService.sendMessage(
        selectedInstanceId,
        testPhone,
        testMessage
      );

      if (result.success) {
        addTestResult({
          status: 'success',
          message: `Mensagem enviada para ${testPhone}`,
          details: result.data,
          timestamp: startTime
        });
      } else {
        throw new Error(result.error || 'Falha no envio');
      }
    } catch (error: any) {
      addTestResult({
        status: 'error',
        message: `Erro no envio: ${error.message}`,
        timestamp: startTime
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Teste 5: Verificar webhook
  const testWebhook = async () => {
    setIsLoading(true);
    const startTime = new Date().toISOString();
    
    try {
      console.log('[WhatsApp Test] 🔗 Testando webhook...');
      
      const webhookUrl = 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web';
      
      // Simular evento de webhook
      const testPayload = {
        event: 'messages.upsert',
        instanceName: instanceName,
        data: {
          messages: [{
            key: {
              id: `test_${Date.now()}`,
              remoteJid: '5511999999999@s.whatsapp.net',
              fromMe: false
            },
            message: {
              conversation: 'Teste de webhook'
            }
          }]
        },
        timestamp: new Date().toISOString()
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer default-token'
        },
        body: JSON.stringify(testPayload)
      });

      if (response.ok) {
        const data = await response.json();
        addTestResult({
          status: 'success',
          message: 'Webhook respondeu corretamente',
          details: data,
          timestamp: startTime
        });
      } else {
        throw new Error(`Webhook retornou ${response.status}`);
      }
    } catch (error: any) {
      addTestResult({
        status: 'error',
        message: `Erro no webhook: ${error.message}`,
        timestamp: startTime
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Teste 6: Verificar banco de dados
  const testDatabase = async () => {
    setIsLoading(true);
    const startTime = new Date().toISOString();
    
    try {
      console.log('[WhatsApp Test] 🗄️ Testando conexão banco...');
      
      const { data: instances, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .limit(5);

      if (error) throw error;

      addTestResult({
        status: 'success',
        message: `Banco conectado - ${instances?.length || 0} instâncias encontradas`,
        details: { instanceCount: instances?.length },
        timestamp: startTime
      });
    } catch (error: any) {
      addTestResult({
        status: 'error',
        message: `Erro no banco: ${error.message}`,
        timestamp: startTime
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Executar todos os testes
  const runAllTests = async () => {
    setTestResults([]);
    await testDatabase();
    await testVPSConnection();
    await testCreateInstance();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar criação
    await testQRCode();
    await testWebhook();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Teste WhatsApp Web.js</h2>
          <p className="text-gray-600">Diagnóstico completo do sistema WhatsApp</p>
        </div>
        <Badge variant="outline" className="border-blue-300 text-blue-700">
          <Zap className="h-3 w-3 mr-1" />
          Sistema de Testes
        </Badge>
      </div>

      {/* Status VPS */}
      {vpsStatus && (
        <Alert>
          <Globe className="h-4 w-4" />
          <AlertDescription>
            VPS Status: <strong>{vpsStatus.status}</strong> | 
            Instâncias Ativas: <strong>{vpsStatus.activeInstances}</strong> | 
            Versão: <strong>{vpsStatus.version}</strong>
          </AlertDescription>
        </Alert>
      )}

      {/* Configurações de Teste */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Configurações de Teste
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Nome da Instância</label>
              <Input
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                placeholder="test_instance"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Telefone de Teste</label>
              <Input
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="5511999999999"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Instância Selecionada</label>
              <Input
                value={selectedInstanceId}
                onChange={(e) => setSelectedInstanceId(e.target.value)}
                placeholder="ID da instância"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Mensagem de Teste</label>
            <Textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Mensagem de teste do sistema"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Botões de Teste */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Testes Individuais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Button 
              onClick={testDatabase} 
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              Banco
            </Button>
            <Button 
              onClick={testVPSConnection} 
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Globe className="h-4 w-4" />
              VPS
            </Button>
            <Button 
              onClick={testCreateInstance} 
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Criar Instância
            </Button>
            <Button 
              onClick={testQRCode} 
              disabled={isLoading || !selectedInstanceId}
              variant="outline"
              className="flex items-center gap-2"
            >
              <QrCode className="h-4 w-4" />
              QR Code
            </Button>
            <Button 
              onClick={testSendMessage} 
              disabled={isLoading || !selectedInstanceId}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Enviar
            </Button>
            <Button 
              onClick={testWebhook} 
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Phone className="h-4 w-4" />
              Webhook
            </Button>
          </div>

          <Separator className="my-4" />
          
          <div className="flex gap-3">
            <Button 
              onClick={runAllTests} 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Executando...' : 'Executar Todos os Testes'}
            </Button>
            <Button 
              onClick={clearResults} 
              variant="outline"
            >
              Limpar Resultados
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Resultados dos Testes ({testResults.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{result.message}</p>
                    <p className="text-xs text-gray-500">{result.timestamp}</p>
                    {result.details && (
                      <pre className="text-xs bg-white p-2 rounded mt-2 overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
