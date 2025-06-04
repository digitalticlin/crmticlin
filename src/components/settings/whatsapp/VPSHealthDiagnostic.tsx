
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Server, Loader2, RefreshCw } from "lucide-react";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";
import { toast } from "sonner";

interface VPSHealthData {
  success: boolean;
  status: string;
  server: string;
  version: string;
  port: number;
  active_instances: number;
  auth_token_configured: boolean;
  endpoints_available?: string[]; // Make this optional
  timestamp: string;
}

export function VPSHealthDiagnostic() {
  const [healthData, setHealthData] = useState<VPSHealthData | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkHealth = async () => {
    setIsChecking(true);
    try {
      const result = await WhatsAppWebService.checkServerHealth();
      
      if (result.success) {
        setHealthData(result.data);
        setLastCheck(new Date());
        toast.success("✅ Servidor VPS online e funcionando!");
      } else {
        throw new Error(result.error || "Falha ao verificar saúde do servidor");
      }
    } catch (error: any) {
      console.error("Erro no diagnóstico de saúde:", error);
      toast.error(`❌ Erro: ${error.message}`);
      setHealthData(null);
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "online") {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Online
        </Badge>
      );
    }
    return (
      <Badge variant="destructive">
        <AlertCircle className="h-3 w-3 mr-1" />
        Offline
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Diagnóstico VPS</CardTitle>
          </div>
          <Button 
            onClick={checkHealth} 
            disabled={isChecking}
            variant="outline" 
            size="sm"
          >
            {isChecking ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Verificar
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {healthData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <div className="mt-1">
                  {getStatusBadge(healthData.status)}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Versão</label>
                <p className="text-sm font-mono mt-1">{healthData.version}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Porta</label>
                <p className="text-sm font-mono mt-1">{healthData.port}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Instâncias Ativas</label>
                <p className="text-sm font-mono mt-1">{healthData.active_instances}</p>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Autenticação</label>
              <div className="mt-1">
                {healthData.auth_token_configured ? (
                  <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Configurada
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Não Configurada
                  </Badge>
                )}
              </div>
            </div>
            
            {healthData.endpoints_available && healthData.endpoints_available.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-600">Endpoints Disponíveis</label>
                <div className="mt-2 flex flex-wrap gap-1">
                  {healthData.endpoints_available.map((endpoint) => (
                    <Badge key={endpoint} variant="outline" className="text-xs">
                      {endpoint}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {lastCheck && (
              <p className="text-xs text-gray-500">
                Última verificação: {lastCheck.toLocaleString()}
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <Server className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-4">
              Clique em "Verificar" para diagnosticar a saúde do servidor VPS
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
