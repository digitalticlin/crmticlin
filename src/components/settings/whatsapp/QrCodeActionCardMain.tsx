
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, RefreshCw, Trash2 } from "lucide-react";
import QrCodeSection from "./QrCodeSection";
import { WhatsAppConnectionStatus } from "@/hooks/whatsapp/database/whatsappDatabaseTypes";

interface QrCodeActionCardMainProps {
  instanceName: string;
  qrCodeUrl: string;
  onRefresh: () => Promise<void>;
  onDelete: () => Promise<void>;
  onConnect: () => Promise<void>;
  onClose: () => void;
  isRefreshing?: boolean;
  isDeleting?: boolean;
  connectionStatus?: WhatsAppConnectionStatus;
}

const QrCodeActionCardMain = ({
  instanceName,
  qrCodeUrl,
  onRefresh,
  onDelete,
  onConnect,
  onClose,
  isRefreshing = false,
  isDeleting = false,
  connectionStatus = "connecting"
}: QrCodeActionCardMainProps) => {
  const [showQrCode, setShowQrCode] = useState(true);

  const handleConnect = async () => {
    try {
      await onConnect();
      // Check if now connected
      if (connectionStatus === "open") {
        onClose();
      }
    } catch (error) {
      console.error("Error connecting:", error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold mb-2">WhatsApp Connection</h3>
          <p className="text-sm text-muted-foreground">Instance: {instanceName}</p>
        </div>

        {showQrCode && qrCodeUrl && (
          <div className="mb-4">
            <QrCodeSection qrCodeUrl={qrCodeUrl} />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Button
            onClick={handleConnect}
            className="w-full"
            disabled={connectionStatus === "open"}
          >
            {connectionStatus === "open" ? "Connected!" : "I've Scanned the QR Code"}
          </Button>

          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="w-full"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? "Refreshing..." : "Refresh QR Code"}
          </Button>

          <Button
            variant="destructive"
            onClick={onDelete}
            disabled={isDeleting}
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeleting ? "Deleting..." : "Delete Instance"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QrCodeActionCardMain;
