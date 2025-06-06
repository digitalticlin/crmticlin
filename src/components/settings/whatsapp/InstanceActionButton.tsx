
import { Button } from "@/components/ui/button";
import { CheckCircle, RefreshCw, Eye, QrCode } from "lucide-react";
import { useQRCodeValidation } from "@/hooks/whatsapp/useQRCodeValidation";
import { useState } from "react";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";
import { toast } from "sonner";

interface InstanceActionButtonProps {
  connectionStatus: string;
  webStatus?: string;
  qrCode?: string | null;
  instanceId: string;
  onRefreshQR: (instanceId: string) => void;
  onShowQR: () => void;
}

export function InstanceActionButton({
  connectionStatus,
  webStatus,
  qrCode,
  instanceId,
  onRefreshQR,
  onShowQR
}: InstanceActionButtonProps) {
  const { validateQRCode } = useQRCodeValidation();
  const qrValidation = validateQRCode(qrCode);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  
  const isConnected = connectionStatus === 'connected' || 
                     connectionStatus === 'ready' || 
                     connectionStatus === 'open';
  const isCreating = webStatus === 'creating';

  const getQRStatus = () => {
    if (!qrCode) {
      return { status: 'none' };
    }

    if (qrValidation.isPlaceholder) {
      return { status: 'placeholder' };
    }

    if (!qrValidation.isValid) {
      return { status: 'invalid' };
    }

    return { status: 'valid' };
  };

  const qrStatus = getQRStatus();

  // CORREÇÃO CRÍTICA: Função para gerar QR Code manualmente via backend
  const handleGenerateQRCode = async () => {
    setIsGeneratingQR(true);
    console.log('[Instance Action] 🔄 CORREÇÃO CRÍTICA - Gerando QR Code via backend para:', instanceId);
    
    try {
      const result = await WhatsAppWebService.getQRCode(instanceId);
      
      if (result.success && result.qrCode) {
        console.log('[Instance Action] ✅ CORREÇÃO CRÍTICA - QR Code obtido com sucesso do backend');
        toast.success('QR Code gerado com sucesso!');
        
        // Chamar a função de refresh para atualizar a lista
        onRefreshQR(instanceId);
      } else if (result.waiting) {
        console.log('[Instance Action] ⏳ CORREÇÃO CRÍTICA - QR Code ainda sendo processado');
        toast.info('QR Code ainda está sendo gerado, aguarde...');
        
        // Tentar novamente em 3 segundos
        setTimeout(() => {
          onRefreshQR(instanceId);
        }, 3000);
      } else {
        throw new Error(result.error || 'Falha ao obter QR Code do backend');
      }
    } catch (error: any) {
      console.error('[Instance Action] ❌ CORREÇÃO CRÍTICA - Erro ao gerar QR Code:', error);
      toast.error(`Erro ao gerar QR Code: ${error.message}`);
    } finally {
      setIsGeneratingQR(false);
    }
  };

  if (isConnected) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
        disabled
      >
        <CheckCircle className="h-4 w-4 mr-1" />
        Ativo
      </Button>
    );
  }

  if (isCreating) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="bg-blue-50 border-blue-200 text-blue-700"
        disabled
      >
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-1" />
        Preparando...
      </Button>
    );
  }

  if (qrStatus.status === 'valid') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onShowQR}
        className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
      >
        <Eye className="h-4 w-4 mr-1" />
        Ver QR Code
      </Button>
    );
  }

  // CORREÇÃO CRÍTICA: Botão "Gerar QR Code" que faz requisição manual ao backend
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleGenerateQRCode}
      disabled={isGeneratingQR}
      className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
    >
      {isGeneratingQR ? (
        <>
          <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
          Gerando...
        </>
      ) : (
        <>
          <QrCode className="h-4 w-4 mr-1" />
          Gerar QR Code
        </>
      )}
    </Button>
  );
}
