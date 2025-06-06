
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { QRCodeTimer } from "./QRCodeTimer";
import { QRCodeProgress } from "./QRCodeProgress";
import { QRCodeInstructions } from "./QRCodeInstructions";

interface QRCodeDisplayProps {
  qrCodeUrl: string | null;
  isWaitingForQR: boolean;
  currentAttempt: number;
  maxAttempts: number;
  isExpired: boolean;
  onExpired: () => void;
  isOpen: boolean;
}

export const QRCodeDisplay = ({
  qrCodeUrl,
  isWaitingForQR,
  currentAttempt,
  maxAttempts,
  isExpired,
  onExpired,
  isOpen
}: QRCodeDisplayProps) => {
  // ESTADO: Aguardando QR Code
  if (isWaitingForQR && !qrCodeUrl) {
    return (
      <div className="bg-blue-50 p-8 rounded-lg border-2 border-blue-200 mb-4 flex flex-col items-center">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
        <div className="text-center">
          <h3 className="font-medium text-blue-900 mb-2">Preparando QR Code...</h3>
          <QRCodeProgress currentAttempt={currentAttempt} maxAttempts={maxAttempts} />
        </div>
      </div>
    );
  }

  // ESTADO: QR Code disponível
  if (qrCodeUrl && !isExpired) {
    return (
      <>
        <div className="bg-white p-4 rounded-lg border-2 border-green-200 mb-4">
          <img 
            src={qrCodeUrl} 
            alt="QR Code para conexão do WhatsApp" 
            className="w-64 h-64 object-contain"
          />
        </div>
        
        <QRCodeTimer isOpen={isOpen} onExpired={onExpired} />
        
        {currentAttempt > 0 && (
          <p className="text-xs text-green-600 mb-1 text-center">
            ✅ Obtido na tentativa {currentAttempt} (otimizado!)
          </p>
        )}
        
        <QRCodeInstructions />
      </>
    );
  }

  // ESTADO: QR Code expirado
  if (isExpired) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-orange-500" />
        <h3 className="font-medium text-orange-700 mb-2">QR Code Expirado</h3>
        <p className="text-sm text-muted-foreground mb-4">
          O QR Code expirou por segurança. Feche este modal e tente criar uma nova instância.
        </p>
      </div>
    );
  }

  // ESTADO: QR Code indisponível
  return (
    <div className="text-center py-8">
      <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-500" />
      <h3 className="font-medium text-red-700 mb-2">QR Code Indisponível</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Não foi possível obter o QR Code. Tente novamente.
      </p>
    </div>
  );
};
