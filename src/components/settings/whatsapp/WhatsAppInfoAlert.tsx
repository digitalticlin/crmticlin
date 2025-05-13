
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const WhatsAppInfoAlert = () => {
  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Importante</AlertTitle>
      <AlertDescription>
        Para conectar seu WhatsApp, escaneie o QR code com seu aplicativo WhatsApp. 
        O QR code expira após alguns minutos. Se expirar, clique em "Gerar novo QR Code".
      </AlertDescription>
    </Alert>
  );
};

export default WhatsAppInfoAlert;
