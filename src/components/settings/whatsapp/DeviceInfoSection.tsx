
import { Battery, BatteryMedium, Info, RefreshCw, Smartphone } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { WhatsAppInstance } from "@/hooks/whatsapp/whatsappInstanceStore";

interface DeviceInfoSectionProps {
  deviceInfo: WhatsAppInstance['deviceInfo'];
}

const DeviceInfoSection = ({ deviceInfo }: DeviceInfoSectionProps) => {
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
    <div className="mb-4 space-y-4">
      {/* Success message */}
      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
        <p className="text-sm text-green-700 dark:text-green-400">
          WhatsApp conectado com sucesso. Agora você pode gerenciar suas conversas.
        </p>
      </div>
      
      {/* Device Info - Only when connected and device info exists */}
      {deviceInfo && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Dispositivo:</span>
            </div>
            <div className="font-medium">{deviceInfo.deviceModel || deviceInfo.model || "Desconhecido"}</div>
            
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1">
                {getBatteryIcon(deviceInfo.batteryLevel)}
                <span className="text-muted-foreground">Bateria:</span>
              </div>
            </div>
            <div className="font-medium">
              {formatBatteryLevel(deviceInfo.batteryLevel)}
              {deviceInfo.batteryLevel !== undefined && (
                <Progress 
                  value={deviceInfo.batteryLevel} 
                  className="h-1.5 mt-1"
                />
              )}
            </div>
            
            <div className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Versão:</span>
            </div>
            <div className="font-medium">{"Desconhecido"}</div>
            
            <div className="flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Conexão:</span>
            </div>
            <div className="font-medium">{formatDate(deviceInfo.lastSeen)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceInfoSection;
