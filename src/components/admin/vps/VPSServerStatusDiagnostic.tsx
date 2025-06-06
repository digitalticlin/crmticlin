
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Server, CheckCircle, XCircle, Info, Loader2 } from "lucide-react";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";

export interface ServerStatusResult {
  success: boolean;
  data?: {
    status: string;
    version?: string;
    server?: string;
    permanentMode?: boolean;
    activeInstances?: number;
  };
  error?: string;
}

export const VPSServerStatusDiagnostic = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ServerStatusResult | null>(null);

  const checkServerStatus = async () => {
    setLoading(true);
    try {
      const response = await WhatsAppWebService.checkServerHealth();
      
      const normalizedResult: ServerStatusResult = {
        success: response.success,
        data: response.success ? {
          status: response.data?.status || 'unknown',
          version: response.data?.version,
          server: response.data?.server,
          permanentMode: response.data?.permanent_mode || response.data?.permanentMode,
          activeInstances: response.data?.active_instances || response.data?.activeInstances
        } : { status: 'offline' },
        error: response.error
      };
      
      setResult(normalizedResult);
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || "Erro ao verificar status do servidor",
        data: { status: 'error' }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-500" />
            <div>
              <CardTitle className="text-base">Servidor WhatsApp.js</CardTitle>
              <CardDescription>Verificar status e saúde</CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={checkServerStatus}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              'Verificar Status'
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {result ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">
                {result.success
                  ? 'Servidor está online e operacional'
                  : 'Servidor offline ou inacessível'}
              </span>
            </div>

            {result.success && result.data && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-500">Status:</span>
                  <span className="ml-2 font-medium">
                    {result.data.status}
                  </span>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-500">Versão:</span>
                  <span className="ml-2 font-medium">
                    {result.data.version || 'N/A'}
                  </span>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-500">Servidor:</span>
                  <span className="ml-2 font-medium">
                    {result.data.server || 'N/A'}
                  </span>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-500">Modo persistente:</span>
                  <span className="ml-2 font-medium">
                    {result.data.permanentMode ? 'Sim' : 'Não'}
                  </span>
                </div>
                <div className="bg-gray-50 p-2 rounded col-span-2">
                  <span className="text-gray-500">Instâncias ativas:</span>
                  <span className="ml-2 font-medium">
                    {result.data.activeInstances || 0}
                  </span>
                </div>
              </div>
            )}

            {!result.success && result.error && (
              <div className="bg-red-50 text-red-700 p-3 rounded border border-red-200 flex items-start">
                <Info className="h-5 w-5 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium">Erro de conexão</p>
                  <p className="text-sm">{result.error}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Server className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>Clique em "Verificar Status" para checar o servidor</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
