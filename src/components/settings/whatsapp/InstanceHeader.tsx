
import { Smartphone, Wifi, WifiOff } from "lucide-react";

interface InstanceHeaderProps {
  instanceName: string;
  connectionStatus: string;
  phoneNumber?: string;
}

const InstanceHeader = ({ instanceName, connectionStatus, phoneNumber }: InstanceHeaderProps) => {
  const isConnected = connectionStatus === 'connected' || connectionStatus === 'open';

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Smartphone className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold">{instanceName}</h3>
          {phoneNumber && (
            <p className="text-sm text-muted-foreground">{phoneNumber}</p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {isConnected ? (
          <Wifi className="h-5 w-5 text-green-500" />
        ) : (
          <WifiOff className="h-5 w-5 text-red-500" />
        )}
        <span className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
          {isConnected ? 'Conectado' : 'Desconectado'}
        </span>
      </div>
    </div>
  );
};

export default InstanceHeader;
