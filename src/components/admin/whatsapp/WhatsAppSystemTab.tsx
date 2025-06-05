
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Server, 
  Zap, 
  RefreshCw, 
  Settings 
} from "lucide-react";

interface WhatsAppSystemTabProps {
  isHealthy: boolean;
  syncCount: number;
  lastSync?: string;
  connectedInstances: any[];
  disconnectedInstances: any[];
}

export const WhatsAppSystemTab = ({
  isHealthy,
  syncCount,
  lastSync,
  connectedInstances,
  disconnectedInstances
}: WhatsAppSystemTabProps) => {
  return (
    <div className="space-y-6">
      {/* Status do sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Status do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Estado Geral:</span>
                <Badge variant={isHealthy ? "default" : "secondary"}>
                  {isHealthy ? "Saudável" : "Atenção Necessária"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Sincronizações:</span>
                <span className="text-sm text-gray-600">{syncCount} realizadas</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Última Verificação:</span>
                <span className="text-sm text-gray-600">
                  {lastSync ? new Date(lastSync).toLocaleString() : 'Nunca'}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">Resumo Rápido</h4>
              <p className="text-sm text-gray-600">
                Sistema operando normalmente com {connectedInstances.length} instâncias ativas. 
                {disconnectedInstances.length > 0 && ` ${disconnectedInstances.length} instâncias precisam de atenção.`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Ações Administrativas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start gap-2">
              <RefreshCw className="h-4 w-4" />
              Sincronizar Todas
            </Button>
            
            <Button variant="outline" className="justify-start gap-2">
              <Settings className="h-4 w-4" />
              Configurações VPS
            </Button>
            
            <Button variant="outline" className="justify-start gap-2">
              <Server className="h-4 w-4" />
              Status do Servidor
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
