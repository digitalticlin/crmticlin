
interface WhatsAppWebWaitingStateProps {
  isWaitingForQR: boolean;
  instanceName: string;
}

export const WhatsAppWebWaitingState = ({
  isWaitingForQR,
  instanceName
}: WhatsAppWebWaitingStateProps) => {
  if (!isWaitingForQR) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        <div>
          <p className="text-sm font-medium text-blue-900">
            Preparando QR Code para "{instanceName}"...
          </p>
          <p className="text-xs text-blue-700">
            O modal abrirá automaticamente
          </p>
        </div>
      </div>
    </div>
  );
};
