
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
    </div>
  );
};
