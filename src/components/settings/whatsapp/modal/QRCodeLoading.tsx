
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";

interface QRCodeLoadingProps {
  pollAttempt: number;
  maxAttempts: number;
  isRefreshing: boolean;
  isPolling: boolean;
  onRefresh: () => void;
}

export const QRCodeLoading = ({ 
  pollAttempt, 
  maxAttempts, 
  isRefreshing, 
  isPolling, 
  onRefresh 
}: QRCodeLoadingProps) => {
  return (
    <div className="text-center py-8">
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-4">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-sm font-medium text-blue-900 mb-2">
          Gerando QR Code... {pollAttempt > 0 && `(${pollAttempt}/${maxAttempts})`}
        </p>
        <p className="text-xs text-blue-700">
          Aguarde enquanto o WhatsApp Web.js é inicializado
        </p>
        
        {pollAttempt > 0 && (
          <div className="w-full bg-blue-200 rounded-full h-2 mt-3">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(pollAttempt / maxAttempts) * 100}%` }}
            />
          </div>
        )}
      </div>
      
      <Button 
        variant="outline" 
        onClick={onRefresh}
        disabled={isRefreshing || isPolling}
        className="w-full"
      >
        {isRefreshing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Tentando novamente...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </>
        )}
      </Button>
    </div>
  );
};
