
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, QrCode, Smartphone, CheckCircle } from "lucide-react";
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

  // Auto-polling para QR Code quando modal abre sem QR Code
  useEffect(() => {
    if (isOpen && !qrCode && !isPolling) {
      startPolling();
    }
  }, [isOpen, qrCode]);

  // Limpar polling quando modal fecha
  useEffect(() => {
    if (!isOpen) {
      setIsPolling(false);
      setQrCode(initialQrCode);
    }
  }, [isOpen, initialQrCode]);

  const startPolling = async () => {
    setIsPolling(true);
    toast.info(`Gerando QR Code para "${instanceName}"...`);
    
    const maxAttempts = 10;
    const delayMs = 3000;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`[QR Modal] Tentativa ${attempt}/${maxAttempts} para obter QR Code`);
        
        const result = await onRefreshQRCode(instanceId);
        
        if (result?.qrCode) {
          setQrCode(result.qrCode);
          setIsPolling(false);
          toast.success(`QR Code gerado! Escaneie para conectar "${instanceName}"`);
          return;
        }
        
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        
      } catch (error: any) {
        console.error(`[QR Modal] Erro na tentativa ${attempt}:`, error);
        if (attempt === maxAttempts) {
          setIsPolling(false);
          toast.error(`Erro ao gerar QR Code: ${error.message}`);
          return;
        }
      }
    }
    
    setIsPolling(false);
    toast.warning(`QR Code não disponível após ${maxAttempts} tentativas. Tente novamente.`);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const result = await onRefreshQRCode(instanceId);
      if (result?.qrCode) {
        setQrCode(result.qrCode);
        toast.success('QR Code atualizado!');
      } else {
        toast.info('QR Code ainda não disponível, tentando novamente...');
        await startPolling();
      }
    } catch (error: any) {
      toast.error(`Erro ao atualizar QR Code: ${error.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderContent = () => {
    // Estado: QR Code disponível
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

    // Estado: Gerando QR Code
    return (
      <div className="text-center py-8">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-sm font-medium text-blue-900 mb-2">Gerando QR Code...</p>
          <p className="text-xs text-blue-700">
            Aguarde enquanto o WhatsApp Web.js é inicializado
          </p>
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
