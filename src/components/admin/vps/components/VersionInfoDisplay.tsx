
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertTriangle, Zap } from "lucide-react";
import { VersionInfo } from "../types/versionDiagnosticTypes";

interface VersionInfoDisplayProps {
  versionInfo: VersionInfo;
  deploying: boolean;
  onDeployUpdate: () => void;
}

export const VersionInfoDisplay = ({ versionInfo, deploying, onDeployUpdate }: VersionInfoDisplayProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-600">ONLINE</Badge>;
      case 'offline':
        return <Badge variant="destructive">OFFLINE</Badge>;
      default:
        return <Badge variant="outline">DESCONHECIDO</Badge>;
    }
  };

  const isVersionCurrent = (version: string) => {
    return version === '3.0.0';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          {getStatusIcon(versionInfo.status)}
          <div>
            <h3 className="font-medium">{versionInfo.server}</h3>
            <p className="text-sm text-muted-foreground">31.97.24.222:3001 (via Edge Function)</p>
          </div>
        </div>
        {getStatusBadge(versionInfo.status)}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-sm font-medium">Versão Atual:</div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={isVersionCurrent(versionInfo.version) ? "default" : "destructive"}
              className={isVersionCurrent(versionInfo.version) ? "bg-green-600" : ""}
            >
              {versionInfo.version}
            </Badge>
            {!isVersionCurrent(versionInfo.version) && (
              <span className="text-xs text-red-600">
                (Desatualizada - Esperado: 3.0.0)
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Hash:</div>
          <div className="text-sm text-muted-foreground font-mono">
            {versionInfo.hash?.substring(0, 16)}...
          </div>
        </div>
      </div>

      {versionInfo.endpoints_available && versionInfo.endpoints_available.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Endpoints Disponíveis:</div>
          <div className="flex flex-wrap gap-1">
            {versionInfo.endpoints_available.map((endpoint, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {endpoint}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {!isVersionCurrent(versionInfo.version) && versionInfo.status === 'online' && (
        <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <div className="font-medium text-yellow-800">Atualização Necessária</div>
          </div>
          <p className="text-sm text-yellow-700 mb-3">
            O servidor está rodando uma versão desatualizada que pode não ter todos os endpoints necessários.
          </p>
          <Button 
            onClick={onDeployUpdate} 
            disabled={deploying}
            size="sm"
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            <Zap className="h-4 w-4 mr-2" />
            Atualizar Agora
          </Button>
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        Última verificação: {new Date(versionInfo.timestamp).toLocaleString('pt-BR')}
      </div>
    </div>
  );
};
