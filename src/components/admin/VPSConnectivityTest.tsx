
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Server, CheckCircle, AlertCircle, Wifi } from "lucide-react";
import { toast } from "sonner";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";

interface ConnectivityTestResult {
  success: boolean;
  connectivity: 'online' | 'offline';
  tested_at: string;
  error_details?: string;
  data?: any;
}

export function VPSConnectivityTest() {
  const [testing, setTesting] = useState(false);
  const [lastResult, setLastResult] = useState<ConnectivityTestResult | null>(null);

  const runConnectivityTest = async () => {
    try {
      setTesting(true);
      toast.info("Testando conectividade com a VPS...");

      const result = await WhatsAppWebService.checkServerHealth();
      
      setLastResult({
        success: result.success,
        connectivity: result.data?.connectivity || (result.success ? 'online' : 'offline'),
        tested_at: new Date().toISOString(),
        error_details: result.error,
        data: result.data
      });

      if (result.success) {
        toast.success("VPS está online e respondendo!");
      } else {
        toast.error(`VPS está offline: ${result.error}`);
      }

    } catch (error: any) {
      setLastResult({
        success: false,
        connectivity: 'offline',
        tested_at: new Date().toISOString(),
        error_details: error.message
      });
      
      toast.error(`Erro no teste: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const getStatusBadge = () => {
    if (!lastResult) return null;
    
    if (lastResult.connectivity === 'online') {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Online
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Offline
        </Badge>
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-600" />
            <CardTitle>Teste de Conectividade VPS</CardTitle>
          </div>
          <Button 
            onClick={runConnectivityTest} 
            disabled={testing}
            variant="outline"
            size="sm"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testando...
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4 mr-2" />
                Testar VPS
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Status da VPS WhatsApp Web.js</p>
              <p className="text-sm text-muted-foreground">
                IP: 31.97.24.222:3001
              </p>
            </div>
            {getStatusBadge()}
          </div>

          {lastResult && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Último teste:</span>
                  <p className="text-muted-foreground">
                    {new Date(lastResult.tested_at).toLocaleString()}
                  </p>
                </div>
                
                {lastResult.data?.server && (
                  <div>
                    <span className="font-medium">Servidor:</span>
                    <p className="text-muted-foreground">
                      {lastResult.data.server}
                    </p>
                  </div>
                )}
              </div>

              {lastResult.error_details && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800">Erro:</p>
                  <p className="text-sm text-red-600 mt-1">
                    {lastResult.error_details}
                  </p>
                </div>
              )}

              {lastResult.data && lastResult.success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800 mb-2">Detalhes do Servidor:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {lastResult.data.version && (
                      <div>
                        <span className="font-medium">Versão:</span> {lastResult.data.version}
                      </div>
                    )}
                    {lastResult.data.status && (
                      <div>
                        <span className="font-medium">Status:</span> {lastResult.data.status}
                      </div>
                    )}
                    {lastResult.data.active_instances !== undefined && (
                      <div>
                        <span className="font-medium">Instâncias Ativas:</span> {lastResult.data.active_instances}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Este teste verifica se a VPS está respondendo</p>
            <p>• Se offline, verifique se o servidor WhatsApp Web.js está rodando na VPS</p>
            <p>• Comando para verificar: <code className="bg-gray-200 px-1 rounded">pm2 status</code></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
