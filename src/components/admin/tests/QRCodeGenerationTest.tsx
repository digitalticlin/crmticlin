
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QrCode } from "lucide-react";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";

export const QRCodeGenerationTest = () => {
  const [instanceId, setInstanceId] = useState("instance-test");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, message]);
    console.log(`[QR Code Test] ${message}`);
  };

  const generateQRCode = async () => {
    setIsGenerating(true);
    setQrCode(null);
    setError(null);
    setLogs([]);
    
    try {
      addLog('🚀 Iniciando geração de QR Code via SSH...');
      
      const result = await WhatsAppWebService.getQRCode(instanceId);
      
      if (result.success) {
        if (result.qrCode) {
          setQrCode(result.qrCode);
          addLog('✅ QR Code gerado com sucesso via SSH!');
        } else if (result.waiting) {
          addLog('⏳ Instância aguardando escaneamento...');
          setError('Instância está esperando. Tente novamente em alguns segundos.');
        } else {
          addLog('❌ QR Code não disponível no momento');
          setError('QR Code não disponível. Verifique se a instância está ativa.');
        }
      } else {
        addLog(`❌ Erro: ${result.error}`);
        setError(result.error || 'Erro desconhecido');
      }
      
    } catch (error: any) {
      const errorMsg = error.message || 'Erro inesperado';
      addLog(`❌ Exceção: ${errorMsg}`);
      setError(errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Teste de Geração de QR Code
        </CardTitle>
        <CardDescription>
          Gera um QR Code para uma instância específica
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="instanceId" className="text-sm font-medium">
            ID da Instância
          </label>
          <Input
            id="instanceId"
            value={instanceId}
            onChange={(e) => setInstanceId(e.target.value)}
            placeholder="ID da instância"
          />
        </div>
        <Button onClick={generateQRCode} disabled={isGenerating} className="w-full">
          {isGenerating ? (
            <>
              <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 2V4A8 8 0 0 1 20 12H22A10 10 0 0 0 12 2Z" opacity=".5"/>
                <path fill="currentColor" d="M12 22A8 8 0 0 1 4 12H2A10 10 0 0 0 12 22Z"/>
              </svg>
              Gerando QR Code...
            </>
          ) : (
            <>
              <QrCode className="h-4 w-4 mr-2" />
              Gerar QR Code
            </>
          )}
        </Button>
        {error && (
          <Badge variant="destructive" className="w-full">
            Erro: {error}
          </Badge>
        )}
        {qrCode && (
          <div className="flex justify-center">
            <img src={qrCode} alt="QR Code" className="max-w-xs" />
          </div>
        )}
        {logs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Logs:</h4>
            <ScrollArea className="h-32">
              <div className="text-xs space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="font-mono">
                    {log}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
