
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Loader2, CheckCircle, AlertCircle, ExternalLink, Activity, Server, Shield, Terminal } from "lucide-react";
import { toast } from "sonner";

export const AutoDeployButton = () => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStatus, setDeployStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle');
  const [deployResult, setDeployResult] = useState<any>(null);
  const [diagnostics, setDiagnostics] = useState<any>(null);

  // Executar deploy automaticamente quando o componente carregar
  useEffect(() => {
    handleAutoDeploy();
  }, []);

  const handleAutoDeploy = async () => {
    try {
      setIsDeploying(true);
      setDeployStatus('deploying');
      setDiagnostics(null);
      
      console.log('🚀 Executando deploy automático WhatsApp Server...');
      toast.info('🚀 Iniciando deploy automático via SSH...');

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
          toast.success('🎉 Servidores já estavam online! API porta 80 ativa.');
        } else {
          toast.success('🎉 Deploy concluído! Servidores API (80) e WhatsApp (3001) online.');
        }
        
      } else {
        setDeployStatus('error');
        if (result.ssh_instructions) {
          toast.warning('⚠️ Deploy manual necessário - Verifique as instruções SSH');
        } else {
          throw new Error(result.error || 'Deploy failed');
        }
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
      case 'deploying':
        return <Loader2 className="h-6 w-6 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-600" />;
      default:
        return <Zap className="h-6 w-6 text-green-600" />;
    }
  };

  const getStatusText = () => {
    switch (deployStatus) {
      case 'deploying':
        return 'Executando deploy automático...';
      case 'success':
        return 'Deploy concluído com sucesso!';
      case 'error':
        return 'Erro no deploy - Verifique instruções';
      default:
        return 'Iniciando deploy...';
    }
  };

  const getStatusColor = () => {
    switch (deployStatus) {
      case 'deploying':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <Card className={getStatusColor()}>
      <CardHeader>
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <CardTitle className={`${deployStatus === 'success' ? 'text-green-800' : deployStatus === 'error' ? 'text-red-800' : 'text-blue-800'}`}>
              Deploy Automático SSH
            </CardTitle>
            <p className={`text-sm ${deployStatus === 'success' ? 'text-green-700' : deployStatus === 'error' ? 'text-red-700' : 'text-blue-700'}`}>
              {getStatusText()}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Progresso do Deploy */}
          {isDeploying && (
            <div className="p-3 bg-blue-100 rounded-lg border border-blue-300">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                <Activity className="h-4 w-4 animate-pulse" />
                Deploy em Andamento
              </h4>
              <div className="text-sm text-blue-700 space-y-1">
                <div>🔧 Configurando firewall para porta 80...</div>
                <div>📦 Instalando Node.js e PM2...</div>
                <div>🚀 Criando API Server (porta 80)...</div>
                <div>📱 Criando WhatsApp Server (porta 3001)...</div>
                <div>⚡ Iniciando serviços com PM2...</div>
              </div>
            </div>
          )}

          {/* Instruções SSH manuais */}
          {deployResult && !deployResult.success && deployResult.ssh_instructions && (
            <div className="p-3 bg-yellow-100 rounded-lg border border-yellow-300">
              <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Deploy Manual Necessário
              </h4>
              <div className="text-xs text-yellow-700 space-y-2">
                <div><strong>1.</strong> {deployResult.ssh_instructions.step1}</div>
                <div><strong>2.</strong> {deployResult.ssh_instructions.step2}</div>
                <div><strong>3.</strong> {deployResult.ssh_instructions.step3}</div>
                {deployResult.deploy_script && (
                  <div className="mt-2">
                    <div className="font-medium mb-1">Script de Deploy:</div>
                    <div className="bg-gray-900 text-green-400 p-2 rounded text-xs font-mono max-h-32 overflow-y-auto">
                      {deployResult.deploy_script}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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
                  API Server (Porta 80)
                </div>
                <div className={`flex items-center gap-1 ${diagnostics.whatsapp_server_running ? 'text-green-600' : 'text-gray-600'}`}>
                  <div className={`w-2 h-2 rounded-full ${diagnostics.whatsapp_server_running ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  WhatsApp Server (3001)
                </div>
                <div className={`flex items-center gap-1 ${diagnostics.pm2_running ? 'text-green-600' : 'text-gray-600'}`}>
                  <div className={`w-2 h-2 rounded-full ${diagnostics.pm2_running ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  PM2 Auto-restart
                </div>
              </div>
            </div>
          )}

          {/* Resultado do Deploy */}
          {deployResult && deployStatus === 'success' && (
            <div className="p-3 bg-green-100 rounded-lg border border-green-300">
              <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                <Server className="h-4 w-4" />
                Deploy Realizado com Sucesso
              </h4>
              <div className="text-xs text-green-700 space-y-1">
                <div>✅ API Server: http://31.97.24.222 (porta 80)</div>
                <div>✅ WhatsApp Server: http://31.97.24.222:3001</div>
                <div>✅ PM2: Auto-restart configurado</div>
                <div>✅ Firewall: Portas 80 e 3001 liberadas</div>
                {deployResult.health?.active_instances !== undefined && (
                  <div>📱 Instâncias WhatsApp: {deployResult.health.active_instances}</div>
                )}
                {deployResult.health?.uptime && (
                  <div>⏱️ Uptime: {Math.floor(deployResult.health.uptime)}s</div>
                )}
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-2">
            <Button
              onClick={handleAutoDeploy}
              disabled={isDeploying}
              className={`${deployStatus === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
            >
              {isDeploying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Executando...
                </>
              ) : deployStatus === 'success' ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Re-executar Deploy
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Executar Deploy
                </>
              )}
            </Button>
            
            {deployStatus === 'success' && deployResult?.api_server_url && (
              <Button
                variant="outline"
                onClick={() => window.open(`http://31.97.24.222/health`, '_blank')}
                className="border-green-600 text-green-600"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Testar API Server
              </Button>
            )}

            {deployStatus === 'success' && (
              <Button
                variant="outline"
                onClick={() => window.open(`http://31.97.24.222:3001/health`, '_blank')}
                className="border-green-600 text-green-600"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Testar WhatsApp
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
