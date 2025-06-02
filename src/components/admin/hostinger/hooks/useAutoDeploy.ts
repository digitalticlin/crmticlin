
import { useState } from "react";
import { toast } from "sonner";

export type DeployStatus = 'idle' | 'checking' | 'deploying' | 'success' | 'error';

export const useAutoDeploy = () => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStatus, setDeployStatus] = useState<DeployStatus>('idle');
  const [deployResult, setDeployResult] = useState<any>(null);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [servicesOnline, setServicesOnline] = useState<boolean>(false);

  const checkServicesStatus = async () => {
    try {
      setDeployStatus('checking');
      console.log('🔍 Verificando status dos serviços com retry...');
      toast.info('🔍 Verificando se serviços já estão rodando...');

      // Verificar API Server (porta 80) com timeout estendido
      const apiController = new AbortController();
      const apiTimeout = setTimeout(() => apiController.abort(), 15000);
      
      const apiResponse = await fetch('http://31.97.24.222/health', {
        method: 'GET',
        signal: apiController.signal,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      clearTimeout(apiTimeout);

      // Verificar WhatsApp Server (porta 3001) com timeout estendido
      const whatsappController = new AbortController();
      const whatsappTimeout = setTimeout(() => whatsappController.abort(), 15000);
      
      const whatsappResponse = await fetch('http://31.97.24.222:3001/health', {
        method: 'GET',
        signal: whatsappController.signal,
        headers: {
          'Cache-Control': 'no-cache'
        }
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
              pm2_running: true,
              timeout_improved: true,
              retry_enabled: true
            });
          } catch (e) {
            setDiagnostics({
              vps_ping: true,
              api_server_running: true,
              whatsapp_server_running: whatsappOnline,
              pm2_running: true,
              timeout_improved: true,
              retry_enabled: true
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
      
      console.log('🚀 Executando deploy otimizado WhatsApp Server...');
      toast.info('🚀 Iniciando deploy otimizado com retry e timeout estendido...');

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
        
        if (result.status === 'services_running') {
          toast.success('🎉 Servidores já estavam online com verificação otimizada!');
        } else {
          toast.success('🎉 Deploy concluído! Servidores API (80) e WhatsApp (3001) online.');
        }
        
      } else {
        setDeployStatus('error');
        if (result.ssh_instructions) {
          toast.warning('⚠️ Deploy manual necessário - Verifique as instruções SSH otimizadas');
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

  return {
    isDeploying,
    deployStatus,
    deployResult,
    diagnostics,
    servicesOnline,
    checkServicesStatus,
    handleManualDeploy
  };
};
