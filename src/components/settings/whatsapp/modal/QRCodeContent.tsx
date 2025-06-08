
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, Smartphone } from "lucide-react";

interface QRCodeContentProps {
  qrCode: string | null;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export const QRCodeContent = ({ qrCode, isRefreshing, onRefresh }: QRCodeContentProps) => {
  if (!qrCode) return null;

  return (
    <>
      <div className="bg-white p-4 rounded-lg border-2 border-green-200 mb-4">
        <img 
          src={qrCode} 
          alt="QR Code para conexão do WhatsApp" 
          className="w-64 h-64 object-contain mx-auto"
        />
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
        <div className="flex items-start gap-3">
          <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900 mb-2">Como conectar:</p>
            <ol className="text-blue-700 space-y-1">
              <li>1. Abra o WhatsApp no seu celular</li>
              <li>2. Vá em Menu → Aparelhos conectados</li>
              <li>3. Toque em "Conectar um aparelho"</li>
              <li>4. Escaneie este QR code</li>
            </ol>
          </div>
        </div>
      </div>
      
      <Button 
        variant="outline" 
        onClick={onRefresh}
        disabled={isRefreshing}
        className="w-full"
      >
        {isRefreshing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Atualizando...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar QR Code
          </>
        )}
      </Button>
    </>
  );
};
