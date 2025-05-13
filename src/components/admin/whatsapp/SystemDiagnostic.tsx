
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";

interface SystemStatus {
  name: string;
  status: "operational" | "degraded" | "down";
  details?: string;
}

export const SystemDiagnostic = () => {
  const systemStatuses: SystemStatus[] = [
    {
      name: "API Server",
      status: "operational"
    },
    {
      name: "WebHook Receptor",
      status: "operational"
    },
    {
      name: "Processador de Mensagens",
      status: "operational"
    },
    {
      name: "Serviço de QR Code",
      status: "degraded",
      details: "Degradado (80% funcionando)"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational": return "bg-green-500";
      case "degraded": return "bg-amber-500";
      case "down": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string, details?: string) => {
    switch (status) {
      case "operational": return "Operacional";
      case "degraded": return details || "Degradado";
      case "down": return "Fora do ar";
      default: return "Desconhecido";
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case "operational": return "text-green-600";
      case "degraded": return "text-amber-600";
      case "down": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diagnóstico do Sistema Evolution API</CardTitle>
        <CardDescription>
          Estado atual da integração com a Evolution API
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {systemStatuses.map((systemStatus, index) => (
            <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
              <div className="flex items-center">
                <div className={`h-3 w-3 rounded-full ${getStatusColor(systemStatus.status)} mr-2`}></div>
                <span>{systemStatus.name}</span>
              </div>
              <span className={`text-sm ${getStatusTextColor(systemStatus.status)}`}>
                {getStatusText(systemStatus.status, systemStatus.details)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
