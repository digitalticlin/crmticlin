
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RefreshCw, CheckCircle, AlertTriangle, XCircle, Upload, Zap } from "lucide-react";

interface VersionInfo {
  server: string;
  version: string;
  hash?: string;
  timestamp: string;
  status: 'online' | 'offline' | 'unknown';
  endpoints_available?: string[];
}

export const VPSVersionDiagnostic = () => {
  const [checking, setChecking] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [deployResults, setDeployResults] = useState<any>(null);

  const checkVersion = async () => {
    try {
      setChecking(true);
      toast.info("🔍 Verificando versão do servidor VPS através do edge function...");

      // Usar edge function como proxy para evitar problemas de CORS
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'check_server',
          instanceData: {}
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.success && data?.data) {
        const serverData = data.data;
        setVersionInfo({
          server: serverData.server || 'WhatsApp Web.js Server',
          version: serverData.version || 'unknown',
          hash: serverData.hash || 'not-available',
          timestamp: serverData.timestamp || new Date().toISOString(),
          status: 'online',
          endpoints_available: serverData.endpoints_available || []
        });
        
        toast.success(`✅ Servidor VPS v${serverData.version} detectado!`);
      } else {
        throw new Error('Resposta inválida do servidor');
      }

    } catch (error: any) {
      console.error('Erro ao verificar versão:', error);
      
      setVersionInfo({
        server: 'Erro de Conexão',
        version: 'N/A',
        timestamp: new Date().toISOString(),
        status: 'offline'
      });
      
      toast.error(`❌ Erro: ${error.message}`);
    } finally {
      setChecking(false);
    }
  };

  const deployUpdate = async () => {
    try {
      setDeploying(true);
      setDeployResults(null);
      toast.info("🚀 Iniciando deploy automatizado...");

      const { data, error } = await supabase.functions.invoke('vps_auto_deploy', {
        body: { action: 'deploy' }
      });

      if (error) {
        throw new Error(error.message);
      }

      setDeployResults(data);
      
      if (data.success) {
        toast.success("✅ Deploy concluído! Aguarde 30s e teste novamente.");
        
        // Auto-refresh após deploy
        setTimeout(() => {
          checkVersion();
        }, 30000);
      } else {
        throw new Error('Deploy falhou');
      }

    } catch (error: any) {
      console.error('Erro no deploy:', error);
      toast.error(`❌ Falha no deploy: ${error.message}`);
    } finally {
      setDeploying(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-600">ONLINE</Badge>;
      case 'offline':
        return <Badge variant="destructive">OFFLINE</Badge>;
      default:
        return <Badge variant="outline">DESCONHECIDO</Badge>;
    }
  };

  const isVersionCurrent = (version: string) => {
    return version === '3.0.0';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-600" />
            <CardTitle>Diagnóstico de Versão VPS (via Edge Function)</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={checkVersion} 
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
              onClick={deployUpdate} 
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
      
      <CardContent>
        {!versionInfo && !deployResults && (
          <div className="text-center py-8 text-muted-foreground">
            <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Clique em "Verificar Versão" para diagnóstico via edge function</p>
          </div>
        )}

        {versionInfo && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(versionInfo.status)}
                <div>
                  <h3 className="font-medium">{versionInfo.server}</h3>
                  <p className="text-sm text-muted-foreground">31.97.24.222:3001 (via Edge Function)</p>
                </div>
              </div>
              {getStatusBadge(versionInfo.status)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Versão Atual:</div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={isVersionCurrent(versionInfo.version) ? "default" : "destructive"}
                    className={isVersionCurrent(versionInfo.version) ? "bg-green-600" : ""}
                  >
                    {versionInfo.version}
                  </Badge>
                  {!isVersionCurrent(versionInfo.version) && (
                    <span className="text-xs text-red-600">
                      (Desatualizada - Esperado: 3.0.0)
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Hash:</div>
                <div className="text-sm text-muted-foreground font-mono">
                  {versionInfo.hash?.substring(0, 16)}...
                </div>
              </div>
            </div>

            {versionInfo.endpoints_available && versionInfo.endpoints_available.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Endpoints Disponíveis:</div>
                <div className="flex flex-wrap gap-1">
                  {versionInfo.endpoints_available.map((endpoint, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {endpoint}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {!isVersionCurrent(versionInfo.version) && versionInfo.status === 'online' && (
              <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <div className="font-medium text-yellow-800">Atualização Necessária</div>
                </div>
                <p className="text-sm text-yellow-700 mb-3">
                  O servidor está rodando uma versão desatualizada que pode não ter todos os endpoints necessários.
                </p>
                <Button 
                  onClick={deployUpdate} 
                  disabled={deploying}
                  size="sm"
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Atualizar Agora
                </Button>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Última verificação: {new Date(versionInfo.timestamp).toLocaleString('pt-BR')}
            </div>
          </div>
        )}

        {deployResults && (
          <div className="space-y-4 mt-6">
            <div className="border border-green-200 rounded-lg p-4 bg-green-50">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h4 className="font-medium text-green-800">Deploy Executado</h4>
              </div>
              
              <div className="space-y-2">
                {deployResults.results?.map((result: any, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span className="text-green-700">{result.message}</span>
                  </div>
                ))}
              </div>

              {deployResults.next_steps && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-green-800 mb-2">Próximos Passos:</div>
                  <ul className="space-y-1">
                    {deployResults.next_steps.map((step: string, index: number) => (
                      <li key={index} className="text-xs text-green-700 flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
