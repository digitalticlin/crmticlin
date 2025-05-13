
import { useState, useEffect } from "react";
import { QrCode, Trash2, RefreshCw, Link, Phone, Smartphone, Battery, BatteryMedium, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WhatsAppInstance } from "@/hooks/whatsapp/whatsappInstanceStore";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

  // Format battery level for display
  const formatBatteryLevel = (level?: number) => {
    if (level === undefined) return "Desconhecido";
    return `${Math.round(level)}%`;
  };

  // Format date for better display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Desconhecido";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get battery icon based on level
  const getBatteryIcon = (level?: number) => {
    if (level === undefined) return <BatteryMedium className="h-4 w-4" />;
    
    if (level > 70) {
      return <Battery className="h-4 w-4 text-green-500" />;
    } else if (level > 30) {
      return <BatteryMedium className="h-4 w-4 text-yellow-500" />;
    } else {
      return <Battery className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <Card className="overflow-hidden glass-card border-0">
      <CardContent className="p-0">
        <div className="p-4">
          {/* Header section - always visible */}
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
          
          {/* Connected Section - Only shown when connected */}
          {instance.connected && (
            <div className="mb-4 space-y-4">
              {/* Success message */}
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                <p className="text-sm text-green-700 dark:text-green-400">
                  WhatsApp conectado com sucesso. Agora você pode gerenciar suas conversas.
                </p>
              </div>
              
              {/* Device Info - Only when connected and device info exists */}
              {instance.deviceInfo && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Dispositivo:</span>
                    </div>
                    <div className="font-medium">{instance.deviceInfo.deviceModel || "Desconhecido"}</div>
                    
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1">
                        {getBatteryIcon(instance.deviceInfo.batteryLevel)}
                        <span className="text-muted-foreground">Bateria:</span>
                      </div>
                    </div>
                    <div className="font-medium">
                      {formatBatteryLevel(instance.deviceInfo.batteryLevel)}
                      {instance.deviceInfo.batteryLevel !== undefined && (
                        <Progress 
                          value={instance.deviceInfo.batteryLevel} 
                          className="h-1.5 mt-1"
                          indicatorClassName={
                            instance.deviceInfo.batteryLevel > 70 ? "bg-green-500" : 
                            instance.deviceInfo.batteryLevel > 30 ? "bg-yellow-500" : 
                            "bg-red-500"
                          }
                        />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Versão:</span>
                    </div>
                    <div className="font-medium">{instance.deviceInfo.whatsappVersion || "Desconhecido"}</div>
                    
                    <div className="flex items-center gap-1.5">
                      <RefreshCw className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Conexão:</span>
                    </div>
                    <div className="font-medium">{formatDate(instance.deviceInfo.lastConnectionTime)}</div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* QR Code Section - Only shown when disconnected and QR code exists */}
          {shouldShowQrCode && instance.qrCodeUrl && !instance.connected && (
            <div className="flex flex-col items-center mb-4 p-4 bg-white dark:bg-black rounded-md">
              <img 
                src={instance.qrCodeUrl} 
                alt="QR Code for WhatsApp connection" 
                className="w-48 h-48"
              />
              <p className="text-xs text-center mt-2 text-muted-foreground">
                Escaneie o QR code com seu WhatsApp. O código expira em alguns minutos.
              </p>
            </div>
          )}
          
          {/* Action Buttons - Different based on connection state */}
          <div className="flex gap-2">
            {!instance.connected ? (
              <>
                {/* Disconnected state buttons */}
                <Button 
                  variant="whatsapp" 
                  className="flex-1"
                  onClick={instance.qrCodeUrl ? handleRefreshQrCode : handleConnect}
                  disabled={isLoading || actionInProgress}
                >
                  {instance.qrCodeUrl ? (
                    <>
                      <RefreshCw className={`w-4 h-4 mr-2 ${isLoading || actionInProgress ? "animate-spin" : ""}`} />
                      {isLoading || actionInProgress ? "Atualizando..." : "Atualizar QR Code"}
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4 mr-2" />
                      {isLoading || actionInProgress ? "Conectando..." : "Conectar WhatsApp"}
                    </>
                  )}
                </Button>
              </>
            ) : (
              /* Connected state buttons */
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="destructive" 
                      className="flex-1"
                      onClick={handleDelete}
                      disabled={isLoading || actionInProgress}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {isLoading || actionInProgress ? "Desconectando..." : "Desconectar WhatsApp"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Esta ação irá remover o WhatsApp conectado</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppInstanceCard;
