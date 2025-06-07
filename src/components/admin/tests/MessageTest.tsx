
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Loader2 } from "lucide-react";

interface TestResult {
  status: 'idle' | 'running' | 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

interface MessageTestProps {
  onResult: (result: TestResult) => void;
}

export const MessageTest = ({ onResult }: MessageTestProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [instanceId, setInstanceId] = useState('');
  const [testPhone, setTestPhone] = useState('5511999999999');
  const [testMessage, setTestMessage] = useState('Teste de mensagem automática');

  const runTest = async () => {
    setIsRunning(true);
    onResult({ status: 'running', message: 'Iniciando teste de envio de mensagem...' });

    try {
      const startTime = Date.now();

      // ETAPA 1: Verificar se instância está pronta
      onResult({ status: 'running', message: 'Verificando status da instância...' });
      
      const { data: instance, error: instanceError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('id', instanceId)
        .single();

      if (instanceError || !instance) {
        throw new Error('Instância não encontrada no Supabase');
      }

      if (!['ready', 'open'].includes(instance.connection_status)) {
        throw new Error(`Instância não está pronta. Status: ${instance.connection_status}`);
      }

      // ETAPA 2: Enviar mensagem de teste
      onResult({ status: 'running', message: 'Enviando mensagem teste...' });
      
      const sendResult = await WhatsAppWebService.sendMessage(instanceId, testPhone, testMessage);
      
      if (!sendResult.success) {
        throw new Error(`Falha no envio: ${sendResult.error}`);
      }

      // ETAPA 3: Verificar se mensagem foi salva no banco
      onResult({ status: 'running', message: 'Verificando salvamento da mensagem...' });
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar salvamento
      
      const { data: sentMessages, error: messageError } = await supabase
        .from('messages')
        .select('*')
        .eq('whatsapp_number_id', instanceId)
        .eq('text', testMessage)
        .eq('from_me', true)
        .order('timestamp', { ascending: false })
        .limit(1);

      if (messageError) {
        throw new Error(`Erro ao consultar mensagens: ${messageError.message}`);
      }

      const messageSaved = sentMessages && sentMessages.length > 0;

      // ETAPA 4: Verificar criação/atualização do lead
      const { data: leads, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('whatsapp_number_id', instanceId)
        .eq('phone', testPhone);

      const leadExists = leads && leads.length > 0;

      // RESULTADO
      let status: 'success' | 'warning' = 'success';
      let message = `Mensagem enviada com sucesso em ${Date.now() - startTime}ms`;

      if (!messageSaved) {
        status = 'warning';
        message = 'Mensagem enviada mas não foi salva no banco de dados';
      }

      onResult({
        status,
        message,
        details: {
          sendTime: Date.now() - startTime,
          messageId: sendResult.messageId,
          messageSaved,
          leadExists,
          leadData: leadExists ? leads[0] : null,
          messageData: messageSaved ? sentMessages[0] : null,
          instanceStatus: instance.connection_status,
          testData: {
            phone: testPhone,
            message: testMessage
          }
        }
      });

    } catch (error: any) {
      onResult({
        status: 'error',
        message: `Erro no teste de mensagem: ${error.message}`,
        details: {
          error: error.message,
          instanceId,
          testPhone,
          testMessage,
          timestamp: new Date().toISOString()
        }
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="msg-instance-id">ID da Instância</Label>
        <Input
          id="msg-instance-id"
          value={instanceId}
          onChange={(e) => setInstanceId(e.target.value)}
          placeholder="UUID da instância"
          disabled={isRunning}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="test-phone">Telefone de Teste</Label>
        <Input
          id="test-phone"
          value={testPhone}
          onChange={(e) => setTestPhone(e.target.value)}
          placeholder="5511999999999"
          disabled={isRunning}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="test-message">Mensagem de Teste</Label>
        <Textarea
          id="test-message"
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          placeholder="Mensagem que será enviada"
          disabled={isRunning}
          rows={3}
        />
      </div>
      
      <Button 
        onClick={runTest} 
        disabled={isRunning || !instanceId.trim() || !testPhone.trim() || !testMessage.trim()}
        className="w-full gap-2"
      >
        {isRunning ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Enviando Mensagem...
          </>
        ) : (
          <>
            <MessageCircle className="h-4 w-4" />
            Testar Envio de Mensagem
          </>
        )}
      </Button>
      
      <div className="text-xs text-muted-foreground">
        <p><strong>Este teste vai:</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>Verificar se instância está pronta</li>
          <li>Enviar mensagem de teste</li>
          <li>Verificar se foi salva no banco</li>
          <li>Verificar criação de lead</li>
        </ul>
      </div>
    </div>
  );
};
