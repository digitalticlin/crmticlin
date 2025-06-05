
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";

interface ServerStatus {
  isOnline: boolean;
  version?: string;
  server?: string;
  port?: string;
  isPersistent?: boolean;
  activeInstances?: number;
  error?: string;
}

interface VPSStatusCardProps {
  status: ServerStatus;
}

export const VPSStatusCard = ({ status }: VPSStatusCardProps) => {
  const getStatusIcon = (isOnline: boolean) => {
    return isOnline ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusBadge = (isOnline: boolean) => {
    return (
      <Badge variant={isOnline ? "default" : "destructive"}>
        {isOnline ? "ONLINE" : "OFFLINE"}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Status do Servidor</span>
          {getStatusBadge(status.isOnline)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Conectividade:</span>
            {getStatusIcon(status.isOnline)}
          </div>
          
          {status.port && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Porta:</span>
              <Badge variant="outline">{status.port}</Badge>
            </div>
          )}
          
          {status.server && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Servidor:</span>
              <span className="text-sm">{status.server}</span>
            </div>
          )}
          
          {status.version && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Versão:</span>
              <Badge variant="outline">{status.version}</Badge>
            </div>
          )}
          
          {typeof status.isPersistent === 'boolean' && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Persistência:</span>
              {status.isPersistent ? (
                <Badge variant="default">ATIVADA</Badge>
              ) : (
                <Badge variant="destructive">DESATIVADA</Badge>
              )}
            </div>
          )}
          
          {typeof status.activeInstances === 'number' && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Instâncias Ativas:</span>
              <Badge variant="outline">{status.activeInstances}</Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
