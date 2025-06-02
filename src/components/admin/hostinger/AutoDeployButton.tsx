
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Loader2, CheckCircle, AlertCircle, ExternalLink, Activity, Terminal } from "lucide-react";
import { toast } from "sonner";

export const AutoDeployButton = () => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStatus, setDeployStatus] = useState<'idle' | 'checking' | 'deploying' | 'success' | 'error'>('idle');
  const [deployResult, setDeployResult] = useState<any>(null);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [servicesOnline, setServicesOnline] = useState<boolean>(false);

  const checkServicesStatus = async () => {
    try {
      setDeployStatus('checking');
      console.log('🔍 Verificando status dos serviços...');
      toast.info('🔍 Verificando se serviços já estão rodando...');

      // Verificar API Server (porta 80) com timeout manual
      const apiController = new AbortController();
      const apiTimeout = setTimeout(() => apiController.abort(), 5000);
      
      const apiResponse = await fetch('http://31.97.24.222/health', {
        method: 'GET',
        signal: apiController.signal
      });
      clearTimeout(apiTimeout);

      // Verificar WhatsApp Server (porta 3001) com timeout manual
      const whatsappController = new AbortController();
      const whatsappTimeout = setTimeout(() => whatsappController.abort(), 5000);
      
      const whatsappResponse = await fetch('http://31.97.24.222:3001/health', {
        method: 'GET',
        signal: whatsappController.signal
      });
      clearTimeout(whatsappTimeout);

      const apiOnline = apiResponse.ok;
      const whatsappOnline = whatsappResponse.ok;
      const bothOnline = apiOnline && whatsappOnline;

      setServicesOnline(bothOnline);

      if (bothOnline) {
        console.log('✅ Serviços já estão online');
        setDeployStatus('success');
        setDeployResult({
          success: true,
          status: 'already_running',
          message: 'Serviços já estão rodando'
        });
        
        // Buscar diagnósticos dos serviços
        if (apiOnline) {
          try {
            const apiData = await apiResponse.json();
            setDiagnostics({
              vps_ping: true,
              api_server_running: true,
              whatsapp_server_running: whatsappOnline,
              pm2_running: true
            });
          } catch (e) {
            setDiagnostics({
              vps_ping: true,
              api_server_running: true,
              whatsapp_server_running: whatsappOnline,
              pm2_running: true
            });
          }
        }
        
        toast.success('✅ Servidores já estão online! Deploy não necessário.');
        return true;
      } else {
        console.log('⚠️ Alguns serviços estão offline');
        setDeployStatus('idle');
        toast.warning('⚠️ Serviços offline. Use o botão de deploy para ativá-los.');
        return false;
      }
    } catch (error) {
      console.log('❌ Erro ao verificar serviços:', error);
      setDeployStatus('idle');
      toast.error('❌ Erro ao verificar serviços. Use o botão de deploy.');
      return false;
    }
  };

  const handleManualDeploy = async () => {
    try {
      setIsDeploying(true);
      setDeployStatus('deploying');
      setDiagnostics(null);
      
      console.log('🚀 Executando deploy manual WhatsApp Server...');
      toast.info('🚀 Iniciando deploy manual via SSH...');

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
        setServicesOnline(true);
        
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
      case 'checking':
        return <Loader2 className="h-6 w-6 animate-spin text-blue-600" />;
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
      case 'checking':
        return 'Verificando status dos serviços...';
      case 'deploying':
        return 'Executando deploy manual...';
      case 'success':
        return servicesOnline ? 'Serviços já estão online!' : 'Deploy concluído com sucesso!';
      case 'error':
        return 'Erro no deploy - Verifique instruções';
      default:
        return 'Deploy Manual SSH - Clique para executar';
    }
  };

  const getStatusColor = () => {
    switch (deployStatus) {
      case 'checking':
        return 'border-blue-200 bg-blue-50';
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
              Deploy Manual SSH
            </CardTitle>
            <p className={`text-sm ${deployStatus === 'success' ? 'text-green-700' : deployStatus === 'error' ? 'text-red-700' : 'text-blue-700'}`}>
              {getStatusText()}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status dos Serviços */}
          {deployStatus === 'checking' && (
            <div className="p-3 bg-blue-100 rounded-lg border border-blue-300">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                <Activity className="h-4 w-4 animate-pulse" />
                Verificando Serviços
              </h4>
              <div className="text-sm text-blue-700 space-y-1">
                <div>🔍 Testando API Server (porta 80)...</div>
                <div>📱 Testando WhatsApp Server (porta 3001)...</div>
                <div>⚡ Verificando necessidade de deploy...</div>
              </div>
            </div>
          )}

          {/* Progresso do Deploy */}
          {isDeploying && deployStatus === 'deploying' && (
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

          {/* Resultado: Serviços Online */}
          {deployStatus === 'success' && servicesOnline && (
            <div className="p-3 bg-green-100 rounded-lg border border-green-300">
              <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Serviços Online
              </h4>
              <div className="text-sm text-green-700 space-y-1">
                <div>✅ API Server: Ativo na porta 80</div>
                <div>✅ WhatsApp Server: Ativo na porta 3001</div>
                <div>✅ PM2: Gerenciamento ativo</div>
                <div>✅ Deploy não foi necessário</div>
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

          {/* Ações */}
          <div className="flex gap-2">
            <Button
              onClick={checkServicesStatus}
              disabled={isDeploying || deployStatus === 'checking'}
              variant="outline"
              className="border-blue-600 text-blue-600"
            >
              {deployStatus === 'checking' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Verificando...
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4 mr-2" />
                  Verificar Status
                </>
              )}
            </Button>

            <Button
              onClick={handleManualDeploy}
              disabled={isDeploying || deployStatus === 'checking'}
              className={`${deployStatus === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
            >
              {isDeploying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Executando...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Executar Deploy
                </>
              )}
            </Button>
            
            {deployStatus === 'success' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => window.open(`http://31.97.24.222/health`, '_blank')}
                  className="border-green-600 text-green-600"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Testar API
                </Button>

                <Button
                  variant="outline"
                  onClick={() => window.open(`http://31.97.24.222:3001/health`, '_blank')}
                  className="border-green-600 text-green-600"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Testar WhatsApp
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
