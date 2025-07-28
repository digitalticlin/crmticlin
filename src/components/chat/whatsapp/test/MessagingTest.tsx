
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { MessageSendingService } from '@/services/whatsapp/services/messageSendingService';
import { useWhatsAppDatabase } from '@/hooks/whatsapp/useWhatsAppDatabase';

export const MessagingTest = () => {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const { getActiveInstance } = useWhatsAppDatabase();
  const activeInstance = getActiveInstance();

  const handleTest = async () => {
    if (!activeInstance) {
      toast.error('Nenhuma instância WhatsApp conectada');
      return;
    }

    if (!phone || !message) {
      toast.error('Preencha telefone e mensagem');
      return;
    }

    setIsTesting(true);
    setLastResult(null);

    try {
      console.log('[MessagingTest] 🧪 Testando envio de mensagem:', {
        instanceId: activeInstance.id,
        instanceName: activeInstance.instance_name,
        phone: phone.substring(0, 4) + '****',
        messageLength: message.length
      });

      const result = await MessageSendingService.sendMessage(
        activeInstance.id,
        phone,
        message
      );

      setLastResult(result);

      if (result.success) {
        toast.success('✅ Mensagem enviada com sucesso!');
      } else {
        toast.error(`❌ Erro: ${result.error}`);
      }

    } catch (error: any) {
      console.error('[MessagingTest] ❌ Erro no teste:', error);
      setLastResult({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString() 
      });
      toast.error(`❌ Erro crítico: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧪 Teste de Envio de Mensagens
        </CardTitle>
        {activeInstance && (
          <p className="text-sm text-muted-foreground">
            Instância: <strong>{activeInstance.instance_name}</strong>
            <br />
            Status: <span className="text-green-600">{activeInstance.connection_status}</span>
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Telefone (com DDD)</label>
          <Input
            type="text"
            placeholder="Ex: 11999887766"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Mensagem</label>
          <Input
            type="text"
            placeholder="Digite sua mensagem de teste"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-1"
          />
        </div>

        <Button 
          onClick={handleTest}
          disabled={isTesting || !activeInstance || !phone || !message}
          className="w-full"
        >
          {isTesting ? 'Enviando...' : 'Enviar Mensagem de Teste'}
        </Button>

        {lastResult && (
          <div className="mt-4 p-3 rounded-lg bg-muted">
            <h4 className="font-medium mb-2">Último Resultado:</h4>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(lastResult, null, 2)}
            </pre>
          </div>
        )}

        {!activeInstance && (
          <div className="text-center text-yellow-600 text-sm">
            ⚠️ Nenhuma instância WhatsApp conectada
          </div>
        )}
      </CardContent>
    </Card>
  );
};
