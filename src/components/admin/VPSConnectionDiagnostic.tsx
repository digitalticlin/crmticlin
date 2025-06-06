
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ServerCrash, Server, CheckCircle2, AlertTriangle } from "lucide-react";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";

export const VPSConnectionDiagnostic = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<any>(null);
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const checkConnection = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Passo 1: Verificar saúde do servidor
      const healthResult = await WhatsAppWebService.checkServerHealth();
      setServerStatus(healthResult.data);
      
      if (!healthResult.success) {
        setError(healthResult.error || "Erro ao verificar saúde do servidor");
        setIsLoading(false);
        return;
      }
      
      // Passo 2: Buscar informações do servidor
      const infoResult = await WhatsAppWebService.getServerInfo();
      if (!infoResult.success) {
        setError(infoResult.error || "Erro ao buscar informações do servidor");
        setIsLoading(false);
        return;
      }
      
      setServerInfo(infoResult.data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (!status) return "text-gray-500";
    return status === 'online' || status === 'healthy' ? "text-green-500" : "text-red-500";
  };

  const getStatusIcon = () => {
    if (isLoading) return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    if (!serverStatus) return <Server className="h-5 w-5 text-gray-500" />;
    
    const isHealthy = serverStatus.status === 'online' || serverStatus.status === 'healthy';
    if (isHealthy) return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    return <ServerCrash className="h-5 w-5 text-red-500" />;
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          {getStatusIcon()}
          Diagnóstico de Conexão VPS
        </CardTitle>
        <Button 
          onClick={checkConnection} 
          disabled={isLoading} 
          variant="outline"
          size="sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verificando...
            </>
          ) : (
            'Verificar Conexão'
          )}
        </Button>
      </CardHeader>
      
      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-start">
            <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Erro de conexão</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}
        
        {serverStatus && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500">Status do servidor</p>
                <p className={`font-medium ${getStatusColor(serverStatus.status)}`}>
                  {serverStatus.status || 'Desconhecido'}
                </p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500">Latência</p>
                <p className="font-medium">
                  {serverStatus.latency ? `${serverStatus.latency}ms` : 'N/A'}
                </p>
              </div>
            </div>
            
            {serverInfo && (
              <div className="bg-gray-50 p-3 rounded-md mt-3">
                <p className="text-sm text-gray-500 mb-2">Informações do servidor</p>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-24">
                  {JSON.stringify(serverInfo, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
        
        {!serverStatus && !isLoading && !error && (
          <div className="text-center py-6 text-gray-500">
            <Server className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Clique em "Verificar Conexão" para diagnosticar o servidor WhatsApp</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
