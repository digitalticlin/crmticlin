
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, QrCode, Smartphone, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCode: string | null;
  instanceName: string;
  instanceId: string;
  onRefreshQRCode: (instanceId: string) => Promise<{ qrCode?: string } | null>;
}

export const QRCodeModal = ({
  isOpen,
  onClose,
  qrCode: initialQrCode,
  instanceName,
  instanceId,
  onRefreshQRCode
}: QRCodeModalProps) => {
  const [qrCode, setQrCode] = useState<string | null>(initialQrCode);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [pollAttempt, setPollAttempt] = useState(0);
  const [maxAttempts] = useState(15);

  // CORREÇÃO: Usar useEffect separados para evitar early returns
  useEffect(() => {
    if (isOpen && !qrCode && !isPolling && instanceId) {
      console.log('[QR Modal] 🚀 Iniciando polling automático para:', instanceName);
      startPolling();
    }
  }, [isOpen, instanceId]);

  useEffect(() => {
    if (!isOpen) {
      console.log('[QR Modal] 🧹 Resetando estado do modal');
      setIsPolling(false);
      setQrCode(initialQrCode);
      setPollAttempt(0);
      setIsRefreshing(false);
    }
  }, [isOpen, initialQrCode]);

  useEffect(() => {
    setQrCode(initialQrCode);
  }, [initialQrCode]);

  const startPolling = async () => {
    if (!instanceId) {
      toast.error('ID da instância não disponível');
      return;
    }

    setIsPolling(true);
    setPollAttempt(0);
    console.log(`[QR Modal] 🔄 Iniciando polling para "${instanceName}"`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (!isOpen) {
        console.log('[QR Modal] ⏹️ Modal fechado, parando polling');
        break;
      }

      try {
        setPollAttempt(attempt);
        console.log(`[QR Modal] 📊 Tentativa ${attempt}/${maxAttempts} para ${instanceName}`);
        
        const result = await onRefreshQRCode(instanceId);
        
        if (result?.qrCode) {
          console.log(`[QR Modal] ✅ QR Code obtido na tentativa ${attempt}!`);
          setQrCode(result.qrCode);
          setIsPolling(false);
          toast.success(`QR Code gerado! Escaneie para conectar "${instanceName}"`);
          return;
        }
        
        // Delay progressivo
        const delay = attempt <= 3 ? (1000 + attempt * 1000) : 3000;
        
        if (attempt < maxAttempts) {
          console.log(`[QR Modal] ⏳ Aguardando ${delay}ms antes da próxima tentativa`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
      } catch (error: any) {
        console.error(`[QR Modal] ❌ Erro na tentativa ${attempt}:`, error);
        
        if (attempt === maxAttempts) {
          setIsPolling(false);
          toast.error(`Erro após ${maxAttempts} tentativas: ${error.message}`);
          return;
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    setIsPolling(false);
    toast.warning(`QR Code não disponível após ${maxAttempts} tentativas. Tente criar uma nova instância.`);
  };

  const handleRefresh = async () => {
    if (!instanceId) {
      toast.error('ID da instância não disponível');
      return;
    }

    setIsRefreshing(true);
    try {
      console.log('[QR Modal] 🔄 Refresh manual para:', instanceName);
      const result = await onRefreshQRCode(instanceId);
      
      if (result?.qrCode) {
        setQrCode(result.qrCode);
        toast.success('QR Code atualizado!');
      } else {
        toast.info('QR Code ainda não disponível, reiniciando polling...');
        await startPolling();
      }
    } catch (error: any) {
      console.error('[QR Modal] ❌ Erro no refresh:', error);
      toast.error(`Erro ao atualizar QR Code: ${error.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderContent = () => {
    // QR Code disponível
    if (qrCode && !isPolling) {
      return (
        <>
          <div className="bg-white p-4 rounded-lg border-2 border-green-200 mb-4">
            <img 
              src={qrCode} 
              alt="QR Code para conexão do WhatsApp" 
              className="w-64 h-64 object-contain mx-auto"
            />
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
            <div className="flex items-start gap-3">
              <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-2">Como conectar:</p>
                <ol className="text-blue-700 space-y-1">
                  <li>1. Abra o WhatsApp no seu celular</li>
                  <li>2. Vá em Menu → Aparelhos conectados</li>
                  <li>3. Toque em "Conectar um aparelho"</li>
                  <li>4. Escaneie este QR code</li>
                </ol>
              </div>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-full"
          >
            {isRefreshing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Atualizando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar QR Code
              </>
            )}
          </Button>
        </>
      );
    }

    // Gerando QR Code
    return (
      <div className="text-center py-8">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-sm font-medium text-blue-900 mb-2">
            Gerando QR Code... {pollAttempt > 0 && `(${pollAttempt}/${maxAttempts})`}
          </p>
          <p className="text-xs text-blue-700">
            Aguarde enquanto o WhatsApp Web.js é inicializado
          </p>
          
          {pollAttempt > 0 && (
            <div className="w-full bg-blue-200 rounded-full h-2 mt-3">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(pollAttempt / maxAttempts) * 100}%` }}
              />
            </div>
          )}
        </div>
        
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={isRefreshing || isPolling}
          className="w-full"
        >
          {isRefreshing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Tentando novamente...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </>
          )}
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white/90 backdrop-blur-xl border border-white/30 rounded-3xl shadow-lg">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center justify-center gap-2 text-xl font-bold text-gray-800">
            <QrCode className="h-6 w-6 text-green-600" />
            Conectar {instanceName}
          </DialogTitle>
        </DialogHeader>
        
        {renderContent()}

        <Button 
          variant="outline" 
          onClick={onClose}
          className="w-full mt-4"
        >
          Fechar
        </Button>
      </DialogContent>
    </Dialog>
  );
};
