
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WhatsAppInstance } from "@/hooks/whatsapp/whatsappInstanceStore";

interface DeviceInfoSectionProps {
  instance: WhatsAppInstance;
}

export const DeviceInfoSection = ({ instance }: DeviceInfoSectionProps) => {
  // Mock device info since it's not available in the current schema
  const deviceInfo = {
    platform: "Windows",
    version: "2.2.24.14",
    battery: 85,
    plugged: true
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Informações do Dispositivo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Plataforma</p>
            <p className="text-sm">{deviceInfo.platform}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Versão</p>
            <p className="text-sm">{deviceInfo.version}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Bateria</p>
            <div className="flex items-center gap-2">
              <span className="text-sm">{deviceInfo.battery}%</span>
              <Badge variant={deviceInfo.plugged ? "default" : "secondary"}>
                {deviceInfo.plugged ? "Conectado" : "Desconectado"}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
