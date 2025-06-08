
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, Loader2 } from "lucide-react";
import { QRCodeContent } from "./modal/QRCodeContent";
import { QRCodeLoading } from "./modal/QRCodeLoading";
import { toast } from "sonner";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCode: string | null;
  instanceName: string;
  instanceId: string;
  onRefreshQRCode: (instanceId: string) => Promise<{ qrCode?: string } | null>;
  isWaitingForQR?: boolean;
}

export const QRCodeModal = ({
  isOpen,
  onClose,
  qrCode: initialQrCode,
  instanceName,
  instanceId,
  onRefreshQRCode,
  isWaitingForQR = false
}: QRCodeModalProps) => {
  const [qrCode, setQrCode] = useState<string | null>(initialQrCode);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [pollAttempt, setPollAttempt] = useState(0);
  const [maxAttempts] = useState(15);

  useEffect(() => {
    if (isOpen && !qrCode && !isPolling && instanceId && !isWaitingForQR) {
      console.log('[QR Modal] 🚀 Iniciando polling automático para:', instanceName);
      startPolling();
    }
  }, [isOpen, instanceId, isWaitingForQR]);

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white/90 backdrop-blur-xl border border-white/30 rounded-3xl shadow-lg">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center justify-center gap-2 text-xl font-bold text-gray-800">
            <QrCode className="h-6 w-6 text-green-600" />
            Conectar {instanceName}
          </DialogTitle>
        </DialogHeader>
        
        {/* ESTADO: Aguardando QR Code (fluxo automático) */}
        {isWaitingForQR && !qrCode ? (
          <div className="text-center py-8">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-sm font-medium text-blue-900 mb-2">
                Gerando QR Code...
              </p>
              <p className="text-xs text-blue-700">
                Aguarde enquanto preparamos sua conexão WhatsApp
              </p>
            </div>
          </div>
        ) : qrCode && !isPolling ? (
          <QRCodeContent 
            qrCode={qrCode} 
            isRefreshing={isRefreshing} 
            onRefresh={handleRefresh} 
          />
        ) : (
          <QRCodeLoading 
            pollAttempt={pollAttempt}
            maxAttempts={maxAttempts}
            isRefreshing={isRefreshing}
            isPolling={isPolling}
            onRefresh={handleRefresh}
          />
        )}

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
