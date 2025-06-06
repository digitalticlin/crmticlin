import { useState, useEffect } from 'react';
import { hostingerApi, HostingerVPS, HostingerApiResponse } from '@/services/hostinger/hostingerApiService';
import { WhatsAppWebService } from '@/services/whatsapp/whatsappWebService';
import { toast } from 'sonner';

interface VPSOperationState {
  isLoading: boolean;
  isInstalling: boolean;
  isRestarting: boolean;
  isBackingUp: boolean;
  isApplyingFixes: boolean;
  isDeployingWhatsApp: boolean;
  isCheckingHealth: boolean;
}

export const useHostingerVPS = () => {
  const [vpsList, setVpsList] = useState<HostingerVPS[]>([]);
  const [selectedVPS, setSelectedVPS] = useState<HostingerVPS | null>(null);
  const [loading, setLoading] = useState(true);
  const [operationState, setOperationState] = useState<VPSOperationState>({
    isLoading: false,
    isInstalling: false,
    isRestarting: false,
    isBackingUp: false,
    isApplyingFixes: false,
    isDeployingWhatsApp: false,
    isCheckingHealth: false
  });
  const [logs, setLogs] = useState<string>('');
  const [whatsappStatus, setWhatsappStatus] = useState<any>(null);
  const [serverHealth, setServerHealth] = useState<any>(null);

  // Carregar lista de VPS
  const loadVPSList = async () => {
    try {
      setLoading(true);
      console.log('[useHostingerVPS] Carregando lista de VPS...');
      
      const result = await hostingerApi.listVPS();
      
      if (result.success && result.data) {
        console.log('[useHostingerVPS] VPS encontradas:', result.data);
        setVpsList(result.data);
        
        // Selecionar automaticamente a primeira VPS se não houver nenhuma selecionada
        if (!selectedVPS && result.data.length > 0) {
          setSelectedVPS(result.data[0]);
          console.log('[useHostingerVPS] VPS selecionada automaticamente:', result.data[0]);
        }
        
        toast.success(`🎉 ${result.data.length} VPS encontrada(s) na sua conta Hostinger!`);
      } else {
        console.error('[useHostingerVPS] Erro ao carregar VPS:', result.error);
        toast.error(`❌ Erro ao carregar VPS: ${result.error}`);
      }
    } catch (error: any) {
      console.error('[useHostingerVPS] Erro:', error);
      toast.error(`❌ Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Executar comando genérico
  const executeCommand = async (command: string, description?: string) => {
    if (!selectedVPS) {
      toast.error('❌ Nenhuma VPS selecionada');
      return null;
    }

    try {
      setOperationState(prev => ({ ...prev, isLoading: true }));
      console.log(`[useHostingerVPS] Executando comando: ${description || command}`);
      
      const result = await hostingerApi.executeCommand(selectedVPS.id, command, description);
      
      if (result.success && result.data) {
        console.log('[useHostingerVPS] Comando executado com sucesso:', result.data);
        toast.success(`✅ ${description || 'Comando executado'} com sucesso!`);
        return result.data;
      } else {
        console.error('[useHostingerVPS] Erro ao executar comando:', result.error);
        toast.error(`❌ Erro: ${result.error}`);
        return null;
      }
    } catch (error: any) {
      console.error('[useHostingerVPS] Erro:', error);
      toast.error(`❌ Erro: ${error.message}`);
      return null;
    } finally {
      setOperationState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Instalar WhatsApp Web.js automaticamente
  const installWhatsAppServer = async () => {
    if (!selectedVPS) {
      toast.error('❌ Nenhuma VPS selecionada');
      return;
    }

    try {
      setOperationState(prev => ({ ...prev, isInstalling: true }));
      toast.info('⏳ Iniciando instalação automática do WhatsApp Web.js...');
      
      const result = await hostingerApi.installWhatsAppServer(selectedVPS.id);
      
      if (result.success) {
        toast.success('🎉 WhatsApp Web.js instalado com sucesso!');
        await checkWhatsAppStatus(); // Verificar status após instalação
      } else {
        toast.error(`❌ Erro na instalação: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`❌ Erro: ${error.message}`);
    } finally {
      setOperationState(prev => ({ ...prev, isInstalling: false }));
    }
  };

  // Aplicar correções SSL e timeout
  const applyWhatsAppFixes = async () => {
    if (!selectedVPS) {
      toast.error('❌ Nenhuma VPS selecionada');
      return;
    }

    try {
      setOperationState(prev => ({ ...prev, isApplyingFixes: true }));
      toast.info('🔧 Aplicando correções SSL e timeout...');
      
      const result = await hostingerApi.applyWhatsAppFixes(selectedVPS.id);
      
      if (result.success) {
        toast.success('✅ Correções aplicadas com sucesso!');
        await checkWhatsAppStatus();
      } else {
        toast.error(`❌ Erro ao aplicar correções: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`❌ Erro: ${error.message}`);
    } finally {
      setOperationState(prev => ({ ...prev, isApplyingFixes: false }));
    }
  };

  // Reiniciar VPS
  const restartVPS = async () => {
    if (!selectedVPS) {
      toast.error('❌ Nenhuma VPS selecionada');
      return;
    }

    try {
      setOperationState(prev => ({ ...prev, isRestarting: true }));
      toast.info('🔄 Reiniciando VPS...');
      
      const result = await hostingerApi.restartVPS(selectedVPS.id);
      
      if (result.success) {
        toast.success('✅ VPS reiniciada com sucesso!');
        // Aguardar um pouco antes de verificar status
        setTimeout(() => loadVPSList(), 10000);
      } else {
        toast.error(`❌ Erro ao reiniciar VPS: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`❌ Erro: ${error.message}`);
    } finally {
      setOperationState(prev => ({ ...prev, isRestarting: false }));
    }
  };

  // Criar backup
  const createBackup = async () => {
    if (!selectedVPS) {
      toast.error('❌ Nenhuma VPS selecionada');
      return;
    }

    try {
      setOperationState(prev => ({ ...prev, isBackingUp: true }));
      toast.info('💾 Criando backup...');
      
      const result = await hostingerApi.createBackup(selectedVPS.id);
      
      if (result.success) {
        toast.success('✅ Backup criado com sucesso!');
      } else {
        toast.error(`❌ Erro ao criar backup: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`❌ Erro: ${error.message}`);
    } finally {
      setOperationState(prev => ({ ...prev, isBackingUp: false }));
    }
  };

  // Deploy WhatsApp Permanent Server
  const deployWhatsAppServer = async () => {
    if (!selectedVPS) {
      toast.error('❌ Nenhuma VPS selecionada');
      return;
    }

    try {
      setOperationState(prev => ({ ...prev, isDeployingWhatsApp: true }));
      toast.info('🚀 Implantando servidor WhatsApp permanente...');
      
      const result = await WhatsAppWebService.getServerInfo();
      
      if (result.success && result.data?.isOnline) {
        toast.success('✅ Servidor WhatsApp já está rodando!');
        await checkServerHealth();
        return;
      }

      // Deploy new server
      const deployResult = await fetch('https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/deploy_whatsapp_server', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const deployData = await deployResult.json();
      
      if (deployData.success) {
        toast.success('🎉 Servidor WhatsApp implantado com sucesso!');
        await checkServerHealth();
      } else {
        toast.error(`❌ Erro na implantação: ${deployData.error}`);
      }
    } catch (error: any) {
      toast.error(`❌ Erro: ${error.message}`);
    } finally {
      setOperationState(prev => ({ ...prev, isDeployingWhatsApp: false }));
    }
  };

  // Check WhatsApp server health
  const checkServerHealth = async () => {
    try {
      setOperationState(prev => ({ ...prev, isCheckingHealth: true }));
      
      // Primeiro passo: verificar conexão básica
      const healthResult = await WhatsAppWebService.checkServerHealth();
      
      if (!healthResult.success) {
        setServerHealth({
          status: 'offline',
          message: healthResult.error || 'Erro ao conectar ao servidor',
          lastCheck: new Date()
        });
        setWhatsappStatus({
          isOnline: false,
          status: 'offline',
          instances: []
        });
        return;
      }
      
      setServerHealth({
        status: 'online',
        message: 'Servidor respondendo corretamente',
        lastCheck: new Date()
      });
      
      // Segundo passo: buscar informações do servidor
      const infoResult = await WhatsAppWebService.getServerInfo();
      
      setWhatsappStatus({
        isOnline: true,
        status: infoResult.data?.info || 'online',
        instances: infoResult.instances || []
      });
      
    } catch (error: any) {
      console.error('[useHostingerVPS] Erro ao verificar saúde:', error);
      setServerHealth({
        status: 'error',
        message: error.message,
        lastCheck: new Date()
      });
    } finally {
      setOperationState(prev => ({ ...prev, isCheckingHealth: false }));
    }
  };

  // Verificar status do WhatsApp
  const checkWhatsAppStatus = async () => {
    if (!selectedVPS) return;

    try {
      console.log('[useHostingerVPS] Verificando status WhatsApp...');
      
      // Check server health first
      await checkServerHealth();
      
      // Then check PM2 status via traditional method
      const result = await hostingerApi.checkWhatsAppStatus(selectedVPS.id);
      
      if (result.success && result.data) {
        console.log('[useHostingerVPS] Status WhatsApp:', result.data);
        setWhatsappStatus(result.data);
      }
    } catch (error: any) {
      console.error('Erro ao verificar status WhatsApp:', error);
    }
  };

  // Carregar logs da VPS
  const loadLogs = async (lines: number = 100) => {
    if (!selectedVPS) return;

    try {
      console.log(`[useHostingerVPS] Carregando ${lines} linhas de logs...`);
      const result = await hostingerApi.getVPSLogs(selectedVPS.id, lines);
      
      if (result.success && result.data) {
        console.log('[useHostingerVPS] Logs carregados');
        setLogs(result.data);
        toast.success('📋 Logs atualizados!');
      } else {
        toast.error(`❌ Erro ao carregar logs: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Erro ao carregar logs:', error);
      toast.error(`❌ Erro: ${error.message}`);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    console.log('[useHostingerVPS] Iniciando hook...');
    loadVPSList();
  }, []);

  // Verificar status do WhatsApp periodicamente
  useEffect(() => {
    if (selectedVPS) {
      console.log('[useHostingerVPS] VPS selecionada, verificando status...');
      checkWhatsAppStatus();
      const interval = setInterval(checkWhatsAppStatus, 30000); // A cada 30 segundos
      return () => clearInterval(interval);
    }
  }, [selectedVPS]);

  return {
    vpsList,
    selectedVPS,
    setSelectedVPS,
    loading,
    operationState,
    logs,
    whatsappStatus,
    serverHealth,
    
    // Actions
    loadVPSList,
    executeCommand,
    installWhatsAppServer,
    deployWhatsAppServer,
    applyWhatsAppFixes,
    restartVPS,
    createBackup,
    checkWhatsAppStatus,
    checkServerHealth,
    loadLogs
  };
};
