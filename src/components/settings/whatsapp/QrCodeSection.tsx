
import { useState, useEffect } from "react";

interface QrCodeSectionProps {
  qrCodeUrl?: string;
}

const QrCodeSection = ({ qrCodeUrl }: QrCodeSectionProps) => {
  const [qrCodeSuccess, setQrCodeSuccess] = useState(false);

  // Detect when a QR code is received to show automatically
  useEffect(() => {
    if (qrCodeUrl && !qrCodeSuccess) {
      console.log("QR code URL exists:", !!qrCodeUrl);
      console.log("QR code URL (first 50 characters):", 
        qrCodeUrl ? qrCodeUrl.substring(0, 50) : "NULL");
      setQrCodeSuccess(true);
    }
  }, [qrCodeUrl, qrCodeSuccess]);

  return (
    <div className="flex flex-col items-center mb-4 p-4 bg-white dark:bg-black rounded-md">
      <img 
        src={qrCodeUrl} 
        alt="QR Code for WhatsApp connection" 
        className="w-48 h-48"
      />
      <p className="text-xs text-center mt-2 text-muted-foreground">
        Escaneie o QR code com seu WhatsApp. O código expira em alguns minutos.
      </p>
    </div>
  );
};

export default QrCodeSection;
