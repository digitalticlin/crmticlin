
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";
import { supabase } from "@/integrations/supabase/client";
import { QrCode, Loader2 } from "lucide-react";

interface TestResult {
  status: 'idle' | 'running' | 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

interface QRCodeGenerationTestProps {
  onResult: (result: TestResult) => void;
}

export const QRCodeGenerationTest = ({ onResult }: QRCodeGenerationTestProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [instanceId, setInstanceId] = useState('');

  const runTest = async () => {
    setIsRunning(true);
    onResult({ status: 'running', message: 'Iniciando teste de geração de QR Code...' });

    try {
      const startTime = Date.now();

      // ETAPA 1: Verificar se instância existe
      onResult({ status: 'running', message: 'Verificando instância...' });
      
      const { data: instance, error: instanceError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('id', instanceId)
        .single();

      if (instanceError || !instance) {
        throw new Error('Instância não encontrada no Supabase');
      }

      // ETAPA 2: Solicitar QR Code via API
      onResult({ status: 'running', message: 'Solicitando QR Code da VPS...' });
      
      const qrResult = await WhatsAppWebService.getQRCode(instanceId);
      
      if (!qrResult.success) {
        throw new Error(`Falha ao obter QR Code: ${qrResult.error}`);
      }

      // ETAPA 3: Verificar se QR Code foi retornado
      if (!qrResult.qrCode) {
        if (qrResult.waiting) {
          onResult({
            status: 'warning',
            message: 'QR Code ainda está sendo gerado. Isso é normal para instâncias novas.',
            details: {
              generationTime: Date.now() - startTime,
              waiting: true,
              instance: instance.instance_name
            }
          });
          return;
        } else {
          throw new Error('QR Code não foi retornado e não está em espera');
        }
      }

      // ETAPA 4: Validar formato do QR Code
      const isValidQR = qrResult.qrCode.startsWith('data:image/') || qrResult.qrCode.length > 50;
      
      if (!isValidQR) {
        throw new Error('QR Code retornado em formato inválido');
      }

      // ETAPA 5: Verificar se foi salvo no Supabase
      onResult({ status: 'running', message: 'Verificando salvamento no Supabase...' });
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar webhook
      
      const { data: updatedInstance } = await supabase
        .from('whatsapp_instances')
        .select('qr_code, web_status')
        .eq('id', instanceId)
        .single();

      const qrSavedInDB = updatedInstance?.qr_code;

      // SUCESSO
      onResult({
        status: 'success',
        message: `QR Code gerado com sucesso em ${Date.now() - startTime}ms`,
        details: {
          generationTime: Date.now() - startTime,
          qrCodeLength: qrResult.qrCode.length,
          source: qrResult.source,
          savedInDB: !!qrSavedInDB,
          webStatus: updatedInstance?.web_status,
          qrCodePreview: qrResult.qrCode.substring(0, 100) + '...'
        }
      });

    } catch (error: any) {
      onResult({
        status: 'error',
        message: `Erro na geração de QR Code: ${error.message}`,
        details: {
          error: error.message,
          instanceId,
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
        <Label htmlFor="qr-instance-id">ID da Instância</Label>
        <Input
          id="qr-instance-id"
          value={instanceId}
          onChange={(e) => setInstanceId(e.target.value)}
          placeholder="UUID da instância"
          disabled={isRunning}
        />
      </div>
      
      <Button 
        onClick={runTest} 
        disabled={isRunning || !instanceId.trim()}
        className="w-full gap-2"
      >
        {isRunning ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Gerando QR Code...
          </>
        ) : (
          <>
            <QrCode className="h-4 w-4" />
            Testar Geração de QR Code
          </>
        )}
      </Button>
      
      <div className="text-xs text-muted-foreground">
        <p><strong>Este teste vai:</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>Solicitar QR Code da VPS</li>
          <li>Validar formato do QR Code</li>
          <li>Verificar salvamento via webhook</li>
          <li>Medir tempo de geração</li>
        </ul>
      </div>
    </div>
  );
};
