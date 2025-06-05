
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Terminal, Download, CheckCircle } from "lucide-react";

interface ServerStatus {
  isOnline: boolean;
  version?: string;
  server?: string;
  port?: string;
  isPersistent?: boolean;
  activeInstances?: number;
  error?: string;
}

interface VPSRecommendationsPanelProps {
  status: ServerStatus;
}

export const VPSRecommendationsPanel = ({ status }: VPSRecommendationsPanelProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Próximos Passos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {!status.isOnline && (
            <Alert>
              <Terminal className="h-4 w-4" />
              <AlertDescription>
                <strong>Servidor Offline:</strong> Verificar se o servidor WhatsApp está rodando na VPS ou se há problemas de conectividade.
              </AlertDescription>
            </Alert>
          )}
          
          {status.isOnline && !status.isPersistent && (
            <Alert>
              <Download className="h-4 w-4" />
              <AlertDescription>
                <strong>Atualização Necessária:</strong> O servidor atual não possui persistência. 
                Recomendamos atualizar para o servidor com persistência.
              </AlertDescription>
            </Alert>
          )}
          
          {status.isOnline && status.isPersistent && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Tudo OK:</strong> Servidor com persistência está funcionando corretamente via Edge Functions!
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
