
import { ConnectWhatsAppButton } from "./ConnectWhatsAppButton";

interface WhatsAppWebEmptyStateProps {
  onConnect: () => Promise<void>;
  isConnecting: boolean;
}

export const WhatsAppWebEmptyState = ({
  onConnect,
  isConnecting
}: WhatsAppWebEmptyStateProps) => {
  return (
    <div className="text-center py-12">
      <ConnectWhatsAppButton 
        onConnect={onConnect} 
        isConnecting={isConnecting}
      />
      
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
        <p className="text-xs text-blue-800">
          <strong>CORREÇÃO ROBUSTA:</strong> O modal QR Code abrirá automaticamente 
          após a criação da instância para uma experiência mais fluida.
        </p>
      </div>
    </div>
  );
};
