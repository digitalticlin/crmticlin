
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { SystemStatus } from "./types";

interface SystemStatusPanelProps {
  systemStatuses: SystemStatus[];
}

export const SystemStatusPanel = ({ systemStatuses }: SystemStatusPanelProps) => {
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
          {systemStatuses.map((item, index) => (
            <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
              <div className="flex items-center">
                <div 
                  className={`h-3 w-3 rounded-full mr-2 ${
                    item.status === 'operational' ? 'bg-green-500' : 
                    item.status === 'degraded' ? 'bg-amber-500' : 
                    'bg-red-500'
                  }`} 
                />
                <span>{item.name}</span>
              </div>
              <span 
                className={`text-sm ${
                  item.status === 'operational' ? 'text-green-600' : 
                  item.status === 'degraded' ? 'text-amber-600' : 
                  'text-red-600'
                }`}
              >
                {item.status === 'operational' ? 'Operacional' : 
                 item.status === 'degraded' ? 'Degradado' : 
                 'Inativo'}
                {item.details && ` (${item.details})`}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
