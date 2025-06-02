
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Loader2, CheckCircle, AlertCircle, ExternalLink, Activity, Server, Shield } from "lucide-react";
import { toast } from "sonner";

export const DirectDeployButton = () => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStatus, setDeployStatus] = useState<'idle' | 'diagnosing' | 'deploying' | 'success' | 'error'>('idle');
  const [deployResult, setDeployResult] = useState<any>(null);
  const [diagnostics, setDiagnostics] = useState<any>(null);

  const handleDirectDeploy = async () => {
    try {
      setIsDeploying(true);
      setDeployStatus('diagnosing');
      setDiagnostics(null);
      
      console.log('🔍 Iniciando diagnóstico profissional da VPS...');
      toast.info('🔍 Executando diagnóstico profissional da VPS...');

      const response = await fetch('https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/deploy_whatsapp_server', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Deploy failed: HTTP ${response.status}`);
      }

      const result = await response.json();
      setDeployResult(result);
      
      if (result.diagnostics) {
        setDiagnostics(result.diagnostics);
      }
      
      if (result.success) {
        console.log('✅ Deploy realizado com sucesso:', result);
        setDeployStatus('success');
        
        if (result.status === 'already_running') {
          toast.success('🎉 Servidor WhatsApp já estava online!');
        } else {
          toast.success('🎉 Deploy realizado com sucesso! Servidor WhatsApp online.');
        }
        
      } else {
        throw new Error(result.error || 'Deploy failed');
      }
    } catch (error: any) {
      console.error('❌ Erro no deploy:', error);
      setDeployStatus('error');
      toast.error(`❌ Erro no deploy: ${error.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  const getStatusIcon = () => {
    switch (deployStatus) {
      case 'diagnosing':
        return <Activity className="h-5 w-5 animate-pulse text-blue-600" />;
      case 'deploying':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Zap className="h-5 w-5 text-green-600" />;
    }
  };

  const getStatusText = () => {
    switch (deployStatus) {
      case 'diagnosing':
        return 'Diagnosticando VPS...';
      case 'deploying':
        return 'Executando deploy...';
      case 'success':
        return 'Deploy concluído com sucesso!';
      case 'error':
        return 'Erro no deploy';
      default:
        return 'Pronto para deploy profissional';
    }
  };

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <CardTitle className="text-green-800">Deploy Profissional VPS</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-green-800 mb-2">
              Sistema de Deploy Inteligente
            </h3>
            <p className="text-sm text-green-700 mb-4">
              Diagnóstico completo + Deploy automático via API autenticada
            </p>
            <p className="text-xs text-green-600">
              Status: {getStatusText()}
            </p>
          </div>

          {/* Diagnósticos */}
          {diagnostics && (
            <div className="p-3 bg-white rounded-lg border">
              <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Diagnóstico VPS
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`flex items-center gap-1 ${diagnostics.vps_ping ? 'text-green-600' : 'text-red-600'}`}>
                  <div className={`w-2 h-2 rounded-full ${diagnostics.vps_ping ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  Conectividade VPS
                </div>
                <div className={`flex items-center gap-1 ${diagnostics.api_server_running ? 'text-green-600' : 'text-red-600'}`}>
                  <div className={`w-2 h-2 rounded-full ${diagnostics.api_server_running ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  API Server
                </div>
                <div className={`flex items-center gap-1 ${diagnostics.api_authentication ? 'text-green-600' : 'text-red-600'}`}>
                  <div className={`w-2 h-2 rounded-full ${diagnostics.api_authentication ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  Autenticação
                </div>
                <div className={`flex items-center gap-1 ${diagnostics.whatsapp_server_running ? 'text-green-600' : 'text-gray-600'}`}>
                  <div className={`w-2 h-2 rounded-full ${diagnostics.whatsapp_server_running ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  WhatsApp Server
                </div>
              </div>
            </div>
          )}

          {/* Resultado do Deploy */}
          {deployResult && deployStatus === 'success' && (
            <div className="p-3 bg-green-100 rounded-lg border border-green-300">
              <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                <Server className="h-4 w-4" />
                Deploy Realizado
              </h4>
              <div className="text-xs text-green-700 space-y-1">
                <div>• Servidor: {deployResult.server_url}</div>
                <div>• Método: {deployResult.deploy_method || 'API VPS'}</div>
                <div>• Status: {deployResult.health?.status || 'Online'}</div>
                {deployResult.health?.active_instances !== undefined && (
                  <div>• Instâncias: {deployResult.health.active_instances}</div>
                )}
                {deployResult.health?.uptime && (
                  <div>• Uptime: {Math.floor(deployResult.health.uptime)}s</div>
                )}
              </div>
            </div>
          )}

          {/* Erros detalhados */}
          {deployResult && deployStatus === 'error' && (
            <div className="p-3 bg-red-100 rounded-lg border border-red-300">
              <h4 className="font-medium text-red-800 mb-2">Detalhes do Erro:</h4>
              <div className="text-xs text-red-700">
                <div className="mb-2">{deployResult.error}</div>
                {deployResult.next_steps && (
                  <div>
                    <div className="font-medium mb-1">Próximos passos:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {deployResult.next_steps.map((step: string, index: number) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleDirectDeploy}
              disabled={isDeploying}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isDeploying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {deployStatus === 'diagnosing' ? 'Diagnosticando...' : 'Fazendo Deploy...'}
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Deploy Profissional
                </>
              )}
            </Button>
            
            {deployStatus === 'success' && deployResult?.server_url && (
              <Button
                variant="outline"
                onClick={() => window.open(`${deployResult.server_url}/health`, '_blank')}
                className="border-green-600 text-green-600"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Verificar Status
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
