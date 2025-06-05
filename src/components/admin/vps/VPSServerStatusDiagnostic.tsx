
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
      console.log('[VPS Status] Verificando servidor na VPS...');
      
      // Tentar conectar nas duas portas possíveis
      const ports = [3001, 3002];
      let foundServer = false;
      
      for (const port of ports) {
        try {
          const response = await fetch(`http://31.97.24.222:${port}/health`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(10000)
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log(`[VPS Status] Servidor encontrado na porta ${port}:`, data);
            
            setStatus({
              isOnline: true,
              version: data.version,
              server: data.server,
              port: port.toString(),
              isPersistent: data.persistenceEnabled || data.permanent_mode || false,
              activeInstances: data.activeInstances || data.active_instances || 0
            });
            
            foundServer = true;
            toast.success(`Servidor encontrado na porta ${port}`);
            break;
          }
        } catch (portError) {
          console.log(`[VPS Status] Porta ${port} não respondeu:`, portError);
        }
      }
      
      if (!foundServer) {
        setStatus({
          isOnline: false,
          error: 'Nenhum servidor WhatsApp encontrado nas portas 3001 ou 3002'
        });
        toast.error('Servidor WhatsApp não está rodando');
      }
      
    } catch (error) {
      console.error('[VPS Status] Erro ao verificar status:', error);
      setStatus({
        isOnline: false,
        error: `Erro de conectividade: ${error.message}`
      });
      toast.error('Erro ao conectar com a VPS');
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
            Verifica qual servidor está rodando na VPS e suas configurações.
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
                      <strong>Servidor Offline:</strong> É necessário instalar e iniciar o servidor WhatsApp na VPS.
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
                      <strong>Tudo OK:</strong> Servidor com persistência está funcionando corretamente!
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
