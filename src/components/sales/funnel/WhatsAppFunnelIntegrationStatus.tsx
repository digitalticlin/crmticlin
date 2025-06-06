
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, MessageSquare, Users, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useWhatsAppFunnelIntegration } from "@/hooks/whatsapp/useWhatsAppFunnelIntegration";

export const WhatsAppFunnelIntegrationStatus = () => {
  const {
    isIntegrationActive,
    isPollingActive,
    isSyncing,
    isHealthy,
    lastSyncTime,
    syncedLeadsCount,
    activeInstance,
    selectedFunnel,
    forceSyncLeads
  } = useWhatsAppFunnelIntegration();

  if (!isIntegrationActive) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="h-5 w-5" />
            Integração WhatsApp ↔ Funil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-700 text-sm">
            Para ativar a sincronização automática de leads, certifique-se que:
          </p>
          <ul className="text-yellow-700 text-sm mt-2 space-y-1">
            <li>• Uma instância WhatsApp esteja conectada</li>
            <li>• Um funil esteja selecionado</li>
            <li>• A saúde das conexões esteja boa</li>
          </ul>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-green-800">
          <CheckCircle className="h-5 w-5" />
          Integração WhatsApp ↔ Funil
          {isPollingActive && (
            <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
              Ativo
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Informações da conexão */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="flex items-center gap-2 text-green-700">
              <MessageSquare className="h-4 w-4" />
              <span className="font-medium">WhatsApp:</span>
            </div>
            <p className="text-green-600 ml-6">{activeInstance?.instance_name}</p>
          </div>
          
          <div>
            <div className="flex items-center gap-2 text-green-700">
              <Users className="h-4 w-4" />
              <span className="font-medium">Funil:</span>
            </div>
            <p className="text-green-600 ml-6">{selectedFunnel?.name}</p>
          </div>
        </div>

        {/* Status da sincronização */}
        <div className="border-t border-green-200 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-700 text-sm">
              <Clock className="h-4 w-4" />
              <span>
                {lastSyncTime 
                  ? `Última sincronização: ${lastSyncTime.toLocaleTimeString('pt-BR')}`
                  : 'Sincronização pendente...'
                }
              </span>
            </div>
            
            <Badge variant="outline" className="border-green-300 text-green-700">
              {syncedLeadsCount} leads sincronizados
            </Badge>
          </div>
          
          <div className="flex items-center justify-between mt-3">
            <div className="text-green-600 text-xs">
              Polling automático a cada 30s • Histórico de 30 mensagens
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={forceSyncLeads}
              disabled={isSyncing}
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              {isSyncing ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Sincronizar Agora
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
