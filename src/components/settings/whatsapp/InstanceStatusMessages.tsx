
import { CheckCircle } from "lucide-react";
import { useQRCodeValidation } from "@/hooks/whatsapp/useQRCodeValidation";

interface InstanceStatusMessagesProps {
  connectionStatus: string;
  qrCode?: string | null;
  isNewInstance?: boolean;
}

export function InstanceStatusMessages({ 
  connectionStatus, 
  qrCode, 
  isNewInstance = false 
}: InstanceStatusMessagesProps) {
  const { validateQRCode } = useQRCodeValidation();
  const qrValidation = validateQRCode(qrCode);
  
  const isConnected = connectionStatus === 'connected' || 
                     connectionStatus === 'ready' || 
                     connectionStatus === 'open';

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

  return (
    <>
      {/* Connection Success Message */}
      {isConnected && (
        <div className="p-3 bg-green-100 border border-green-200 rounded-xl">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">WhatsApp conectado com sucesso!</span>
          </div>
        </div>
      )}

      {/* New Instance Message */}
      {isNewInstance && !isConnected && (
        <div className="p-3 bg-blue-100 border border-blue-200 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-blue-800">Nova instância criada!</span>
          </div>
          <p className="text-sm text-blue-700">
            {qrStatus.status === 'valid' 
              ? '✨ QR Code disponível para escaneamento.' 
              : qrStatus.status === 'placeholder'
              ? '⏳ Aguardando QR Code...'
              : '🔧 Preparando instância...'}
          </p>
        </div>
      )}
    </>
  );
}
