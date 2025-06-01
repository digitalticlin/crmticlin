
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCcw, Zap, CheckCircle, AlertCircle, QrCode } from "lucide-react";
import { WhatsAppRecoveryService, RecoveryStatus } from "@/services/whatsapp/recoveryService";
import { toast } from "sonner";

export const WhatsAppRecoveryPanel = () => {
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryStatus, setRecoveryStatus] = useState<RecoveryStatus | null>(null);
  const [showQR, setShowQR] = useState(false);

  const handleFullRecovery = async () => {
    setIsRecovering(true);
    setRecoveryStatus(null);

    try {
      toast.info("🔧 Iniciando recuperação do sistema WhatsApp...");
      
      const result = await WhatsAppRecoveryService.executeFullRecovery();
      setRecoveryStatus(result);

      if (result.success) {
        toast.success("✅ Sistema WhatsApp restaurado com sucesso!");
        if (result.qrCode) {
          setShowQR(true);
        }
      } else {
        toast.error(`❌ Falha na recuperação: ${result.error}`);
      }

    } catch (error) {
      console.error('Erro na recuperação:', error);
      toast.error("❌ Erro interno na recuperação");
    } finally {
      setIsRecovering(false);
    }
  };

  const handleQuickSync = async () => {
    toast.info("⚡ Executando sincronização rápida...");
    
    const success = await WhatsAppRecoveryService.quickSync();
    
    if (success) {
      toast.success("✅ Sincronização concluída!");
    } else {
      toast.error("❌ Falha na sincronização");
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCcw className="h-5 w-5 text-green-600" />
          Sistema de Recuperação WhatsApp
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Restaure completamente a funcionalidade de mensagens WhatsApp
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status da Recuperação */}
        {recoveryStatus && (
          <Alert className={recoveryStatus.success ? "border-green-500" : "border-red-500"}>
            <div className="flex items-center gap-2">
              {recoveryStatus.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>
                <strong>{recoveryStatus.phase}:</strong> {recoveryStatus.step}
                {recoveryStatus.error && (
                  <div className="mt-1 text-sm text-red-600">
                    Erro: {recoveryStatus.error}
                  </div>
                )}
              </AlertDescription>
            </div>
            {recoveryStatus.progress > 0 && (
              <Progress value={recoveryStatus.progress} className="mt-2" />
            )}
          </Alert>
        )}

        {/* QR Code */}
        {showQR && recoveryStatus?.qrCode && (
          <Alert className="border-blue-500">
            <QrCode className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              <strong>QR Code gerado!</strong> Escaneie com seu WhatsApp para conectar.
              <div className="mt-2 p-2 bg-white rounded border">
                <img 
                  src={recoveryStatus.qrCode} 
                  alt="QR Code WhatsApp" 
                  className="w-48 h-48 mx-auto"
                />
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Ações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={handleFullRecovery}
            disabled={isRecovering}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${isRecovering ? 'animate-spin' : ''}`} />
            {isRecovering ? 'Recuperando...' : 'Recuperação Completa'}
          </Button>

          <Button
            onClick={handleQuickSync}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <Zap className="h-4 w-4 mr-2" />
            Sincronização Rápida
          </Button>
        </div>

        {/* Informações */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">O que será feito:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>✅ Verificar conectividade com VPS</li>
            <li>✅ Criar nova instância WhatsApp</li>
            <li>✅ Sincronizar com banco de dados</li>
            <li>✅ Configurar webhooks automaticamente</li>
            <li>✅ Gerar QR Code para conexão</li>
            <li>✅ Ativar monitoramento em tempo real</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
