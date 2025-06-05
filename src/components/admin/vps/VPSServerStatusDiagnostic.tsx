
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Server, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Terminal,
  Download
} from "lucide-react";
import { toast } from "sonner";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";

interface ServerStatus {
  isOnline: boolean;
  version?: string;
  server?: string;
  port?: string;
  isPersistent?: boolean;
  activeInstances?: number;
  error?: string;
}

export const VPSServerStatusDiagnostic = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<ServerStatus | null>(null);

  const checkServerStatus = async () => {
    setIsLoading(true);
    setStatus(null);
    
    try {
      console.log('[VPS Status] Verificando servidor via Edge Functions...');
      
      // Usar WhatsAppWebService ao invés de chamadas diretas
      const result = await WhatsAppWebService.checkServerHealth();
      
      if (result.success && result.data) {
        console.log('[VPS Status] Servidor encontrado via Edge Functions:', result.data);
        
        setStatus({
          isOnline: true,
          version: result.data.version || 'v4.0.0',
          server: result.data.server || 'WhatsApp Web.js Server',
          port: '3001', // Porta padrão
          isPersistent: result.data.permanent_mode || result.data.permanentMode || true,
          activeInstances: result.data.active_instances || result.data.activeInstances || 0
        });
        
        toast.success('Servidor encontrado e funcionando');
      } else {
        console.error('[VPS Status] Erro na resposta:', result.error);
        setStatus({
          isOnline: false,
          error: result.error || 'Servidor WhatsApp não está respondendo'
        });
        toast.error('Servidor WhatsApp não está funcionando');
      }
      
    } catch (error) {
      console.error('[VPS Status] Erro ao verificar status:', error);
      setStatus({
        isOnline: false,
        error: `Erro de conectividade: ${error.message}`
      });
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

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
    <div className="space-y-6">
      {/* Controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Status do Servidor VPS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={checkServerStatus}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Server className="h-4 w-4" />
              )}
              {isLoading ? 'Verificando...' : 'Verificar Status'}
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-2">
            Verifica o servidor via Edge Functions (método seguro e compatível).
          </p>
        </CardContent>
      </Card>

      {/* Resultados */}
      {status && (
        <div className="space-y-4">
          {/* Status Geral */}
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

          {/* Erro */}
          {status.error && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Problema Detectado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert variant="destructive">
                  <AlertDescription>{status.error}</AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Recomendações */}
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
        </div>
      )}
    </div>
  );
};
