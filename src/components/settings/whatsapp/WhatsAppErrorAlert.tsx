
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface WhatsAppErrorAlertProps {
  lastError: string | null;
}

export const WhatsAppErrorAlert = ({ lastError }: WhatsAppErrorAlertProps) => {
  if (!lastError) return null;

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        {lastError}
      </AlertDescription>
    </Alert>
  );
};
