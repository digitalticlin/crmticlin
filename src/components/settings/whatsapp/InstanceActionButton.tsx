
import { Button } from "@/components/ui/button";
import { CheckCircle, RefreshCw, Eye, QrCode } from "lucide-react";
import { useQRCodeValidation } from "@/hooks/whatsapp/useQRCodeValidation";

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

  if (qrStatus.status === 'placeholder') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => onRefreshQR(instanceId)}
        className="bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
      >
        <RefreshCw className="h-4 w-4 mr-1" />
        Aguardar QR
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onRefreshQR(instanceId)}
      className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
    >
      <QrCode className="h-4 w-4 mr-1" />
      Gerar QR Code
    </Button>
  );
}
