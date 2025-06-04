
import { Smartphone, QrCode } from "lucide-react";
import { useQRCodeValidation } from "@/hooks/whatsapp/useQRCodeValidation";

interface InstanceInfoGridProps {
  connectionStatus: string;
  qrCode?: string | null;
}

export function InstanceInfoGrid({ connectionStatus, qrCode }: InstanceInfoGridProps) {
  const { validateQRCode } = useQRCodeValidation();
  const qrValidation = validateQRCode(qrCode);
  
  const isConnected = connectionStatus === 'connected' || 
                     connectionStatus === 'ready' || 
                     connectionStatus === 'open';
  const isConnecting = connectionStatus === 'connecting';

  const getQRStatus = () => {
    if (!qrCode) {
      return {
        message: 'Sem QR Code',
        color: 'text-gray-500'
      };
    }

    if (qrValidation.isPlaceholder) {
      return {
        message: 'Gerando QR real...',
        color: 'text-yellow-600'
      };
    }

    if (!qrValidation.isValid) {
      return {
        message: 'QR inválido',
        color: 'text-red-600'
      };
    }

    return {
      message: 'QR pronto',
      color: 'text-green-600'
    };
  };

  const qrStatus = getQRStatus();

  return (
    <div className="grid grid-cols-2 gap-4 p-3 bg-white/20 rounded-xl">
      <div className="text-center">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Smartphone className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-600">Dispositivo</span>
        </div>
        <p className="text-sm text-gray-800 font-medium">
          {isConnected ? 'Conectado' : isConnecting ? 'Conectando' : 'Desconectado'}
        </p>
      </div>
      
      <div className="text-center">
        <div className="flex items-center justify-center gap-1 mb-1">
          <QrCode className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-600">QR Code</span>
        </div>
        <p className={`text-sm font-medium ${qrStatus.color}`}>
          {qrStatus.message}
        </p>
      </div>
    </div>
  );
}
