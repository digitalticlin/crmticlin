
import { CheckCircle, Clock } from "lucide-react";

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
  const isConnected = connectionStatus === 'connected' || 
                     connectionStatus === 'ready' || 
                     connectionStatus === 'open';

  const isConnecting = connectionStatus === 'connecting';

  // Success message for connected instances
  if (isConnected) {
    return (
      <div className="p-3 bg-green-100 border border-green-200 rounded-xl">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">WhatsApp conectado</span>
        </div>
      </div>
    );
  }

  // Connecting state
  if (isConnecting) {
    return (
      <div className="p-3 bg-blue-100 border border-blue-200 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-blue-800">Conectando WhatsApp</span>
        </div>
      </div>
    );
  }

  // New instance or waiting for QR
  if (isNewInstance || qrCode) {
    const hasValidQR = qrCode && qrCode !== 'waiting' && !qrCode.includes('Erro');
    
    return (
      <div className="p-3 bg-yellow-100 border border-yellow-200 rounded-xl">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-800">
            {hasValidQR ? 'Escaneie o QR Code para conectar' : 'Preparando conexão'}
          </span>
        </div>
      </div>
    );
  }

  return null;
}
