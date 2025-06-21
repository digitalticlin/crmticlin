
import { Loader2, AlertCircle, QrCode } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface QRCodeDisplayProps {
  qrCode: string | null;
  isLoading: boolean;
  error: string | null;
}

export const QRCodeDisplay = ({ qrCode, isLoading, error }: QRCodeDisplayProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        <p className="text-sm text-gray-600">Gerando QR Code...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!qrCode) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <QrCode className="h-12 w-12 text-gray-400" />
        <p className="text-sm text-gray-600">Clique em "Gerar QR Code" para começar</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center p-4 bg-white rounded-lg border">
      <img 
        src={qrCode} 
        alt="QR Code WhatsApp" 
        className="w-64 h-64 object-contain"
      />
    </div>
  );
};
