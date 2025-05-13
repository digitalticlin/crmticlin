
import { useState, useEffect } from "react";
import { QrCode, Trash2, RefreshCw, Link, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WhatsAppInstance } from "@/hooks/whatsapp/whatsappInstanceStore";

interface WhatsAppInstanceCardProps {
  instance: WhatsAppInstance;
  isLoading: boolean;
  showQrCode: boolean;
  onConnect: (instanceId: string) => Promise<void>;
  onDelete: (instanceId: string) => Promise<void>;
  onRefreshQrCode: (instanceId: string) => Promise<void>;
  onStatusCheck?: (instanceId: string) => void;
}

const WhatsAppInstanceCard = ({
  instance,
  isLoading,
  showQrCode,
  onConnect,
  onDelete,
  onRefreshQrCode,
  onStatusCheck
}: WhatsAppInstanceCardProps) => {
  // Local state to track when QR code was successfully obtained
  const [qrCodeSuccess, setQrCodeSuccess] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Detect when a QR code is received to show automatically
  useEffect(() => {
    if (instance.qrCodeUrl && !qrCodeSuccess) {
      console.log(`QR Code received for instance ${instance.id}: ${instance.instanceName}`);
      console.log("QR code URL exists:", !!instance.qrCodeUrl);
      console.log("QR code URL (first 50 characters):", 
        instance.qrCodeUrl ? instance.qrCodeUrl.substring(0, 50) : "NULL");
      setQrCodeSuccess(true);
      
      // Start frequent status checks when QR code is shown
      if (onStatusCheck) {
        onStatusCheck(instance.id);
      }
      
      // Set up more frequent status checks while QR code is showing
      const statusCheckInterval = setInterval(() => {
        if (onStatusCheck) {
          onStatusCheck(instance.id);
        }
      }, 2000);
      
      // Clear interval if component unmounts or status changes to connected
      return () => {
        clearInterval(statusCheckInterval);
      };
    }
  }, [instance.qrCodeUrl, qrCodeSuccess, instance.id, instance.instanceName, onStatusCheck]);

  // Stop frequent checking when instance gets connected
  useEffect(() => {
    if (instance.connected) {
      setQrCodeSuccess(false); // Reset QR code success state
    }
  }, [instance.connected]);

  // Click function to connect WhatsApp
  const handleConnect = async () => {
    try {
      console.log(`Starting connection for instance ${instance.id}: ${instance.instanceName}`);
      setActionInProgress(true);
      setQrCodeSuccess(false);
      await onConnect(instance.id);
      console.log(`Connection started for ${instance.instanceName}`);
      
      // Trigger more frequent status checks after connection is initiated
      if (onStatusCheck) {
        onStatusCheck(instance.id);
      }
    } catch (error) {
      console.error("Error connecting:", error);
    } finally {
      setActionInProgress(false);
    }
  };

  // Function to update QR code
  const handleRefreshQrCode = async () => {
    try {
      console.log(`Updating QR code for instance ${instance.id}: ${instance.instanceName}`);
      setActionInProgress(true);
      setQrCodeSuccess(false);
      await onRefreshQrCode(instance.id);
      console.log(`QR code updated for ${instance.instanceName}`);
      
      // Trigger more frequent status checks after QR code refresh
      if (onStatusCheck) {
        onStatusCheck(instance.id);
      }
    } catch (error) {
      console.error("Error updating QR code:", error);
    } finally {
      setActionInProgress(false);
    }
  };

  // Function to delete WhatsApp number
  const handleDelete = async () => {
    try {
      console.log(`Deleting instance ${instance.id}: ${instance.instanceName}`);
      setActionInProgress(true);
      await onDelete(instance.id);
      console.log(`Instance ${instance.instanceName} deleted`);
    } catch (error) {
      console.error("Error deleting:", error);
    } finally {
      setActionInProgress(false);
    }
  };

  // Determine if QR code should be shown (when available and shown)
  const shouldShowQrCode = (showQrCode || qrCodeSuccess) && instance.qrCodeUrl;

  return (
    <Card className="overflow-hidden glass-card border-0">
      <CardContent className="p-0">
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h4 className="font-medium">WhatsApp</h4>
              <p className="text-sm text-muted-foreground">Instance: {instance.instanceName}</p>
              {instance.connected && instance.phoneNumber && (
                <div className="flex items-center mt-1 gap-1 text-green-600 dark:text-green-400">
                  <Phone className="w-3 h-3" />
                  <p className="text-xs font-medium">{instance.phoneNumber}</p>
                </div>
              )}
            </div>
            <Badge variant="outline" className={instance.connected ? 
              "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400" : 
              "bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400"}>
              {instance.connected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
          
          {instance.connected && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
              <p className="text-sm text-green-700 dark:text-green-400">
                WhatsApp successfully connected. You can now manage your conversations in the chats page.
              </p>
            </div>
          )}
          
          {shouldShowQrCode && instance.qrCodeUrl && (
            <div className="flex flex-col items-center mb-4 p-4 bg-white dark:bg-black rounded-md">
              <img 
                src={instance.qrCodeUrl} 
                alt="QR Code for WhatsApp connection" 
                className="w-48 h-48"
              />
              <p className="text-xs text-center mt-2 text-muted-foreground">
                Scan the QR code with your WhatsApp application. The QR code expires after a few minutes.
              </p>
            </div>
          )}
          
          <div className="flex gap-2">
            {!instance.connected ? (
              <>
                <Button 
                  variant="whatsapp" 
                  className="flex-1"
                  onClick={handleConnect}
                  disabled={isLoading || actionInProgress}
                >
                  {instance.qrCodeUrl ? (
                    <>
                      <QrCode className="w-4 h-4 mr-2" />
                      {isLoading || actionInProgress ? "Generating QR..." : "Show QR Code"}
                    </>
                  ) : (
                    <>
                      <Link className="w-4 h-4 mr-2" />
                      {isLoading || actionInProgress ? "Connecting..." : "Connect WhatsApp"}
                    </>
                  )}
                </Button>
                
                {instance.qrCodeUrl && (
                  <Button 
                    variant="outline" 
                    onClick={handleRefreshQrCode}
                    disabled={isLoading || actionInProgress}
                  >
                    <RefreshCw className={`w-4 h-4 ${(isLoading || actionInProgress) ? "animate-spin" : ""}`} />
                    <span className="ml-2 hidden sm:inline">
                      {isLoading || actionInProgress ? "Generating..." : "Generate new QR Code"}
                    </span>
                  </Button>
                )}
              </>
            ) : (
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={handleDelete}
                disabled={isLoading || actionInProgress}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isLoading || actionInProgress ? "Disconnecting..." : "Disconnect WhatsApp"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppInstanceCard;
