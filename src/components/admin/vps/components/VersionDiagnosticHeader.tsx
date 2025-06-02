
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Upload } from "lucide-react";

interface VersionDiagnosticHeaderProps {
  checking: boolean;
  deploying: boolean;
  onCheckVersion: () => void;
  onDeployUpdate: () => void;
}

export const VersionDiagnosticHeader = ({
  checking,
  deploying,
  onCheckVersion,
  onDeployUpdate
}: VersionDiagnosticHeaderProps) => {
  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-blue-600" />
          <CardTitle>Diagnóstico de Versão VPS (via Edge Function)</CardTitle>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={onCheckVersion} 
            disabled={checking}
            variant="outline"
            size="sm"
          >
            {checking ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent mr-2" />
                Verificando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Verificar Versão
              </>
            )}
          </Button>
          
          <Button 
            onClick={onDeployUpdate} 
            disabled={deploying}
            className="bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            {deploying ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                Deployando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Deploy Atualização
              </>
            )}
          </Button>
        </div>
      </div>
    </CardHeader>
  );
};
