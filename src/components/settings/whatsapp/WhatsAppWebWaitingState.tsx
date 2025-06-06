
import { Loader2, Timer } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WhatsAppWebWaitingStateProps {
  isWaitingForQR: boolean;
  instanceName: string;
  currentAttempt?: number;
  maxAttempts?: number;
}

export const WhatsAppWebWaitingState = ({ 
  isWaitingForQR, 
  instanceName,
  currentAttempt = 0,
  maxAttempts = 12
}: WhatsAppWebWaitingStateProps) => {
  if (!isWaitingForQR) return null;

  const progressPercentage = maxAttempts > 0 ? Math.min((currentAttempt / maxAttempts) * 100, 100) : 0;
  
  return (
    <Alert className="border-blue-200 bg-blue-50">
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
        <div className="flex-1">
          <AlertDescription className="text-blue-800">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">
                Preparando QR Code para "{instanceName}"...
              </span>
              <div className="flex items-center gap-1 text-sm">
                <Timer className="h-4 w-4" />
                <span>Aguarde</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <span>Preparando...</span>
              <div className="flex-1 bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
            
            <p className="text-xs text-blue-600 mt-1">
              O QR Code aparecerá automaticamente quando estiver pronto
            </p>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};
