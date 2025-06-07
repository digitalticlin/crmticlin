
import { useState, useCallback } from 'react';
import { hostingerApi, HostingerVPS, HostingerApiResponse } from '@/services/hostinger/hostingerApiService';

interface OperationState {
  isDeployingWhatsApp: boolean;
  isExecutingCommand: boolean;
  isRestarting: boolean;
  isCreatingBackup: boolean;
  isInstalling: boolean;
  isApplyingFixes: boolean;
}

interface WhatsAppStatus {
  isOnline: boolean;
  pm2Status: string;
  lastChecked: Date | null;
}

interface ServerHealth {
  isHealthy: boolean;
  lastChecked: Date | null;
  error?: string;
}

export const useVPSManagement = () => {
  const [vpsList, setVpsList] = useState<HostingerVPS[]>([]);
  const [selectedVPS, setSelectedVPS] = useState<HostingerVPS | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [operationState, setOperationState] = useState<OperationState>({
    isDeployingWhatsApp: false,
    isExecutingCommand: false,
    isRestarting: false,
    isCreatingBackup: false,
    isInstalling: false,
    isApplyingFixes: false
  });
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppStatus>({
    isOnline: false,
    pm2Status: '',
    lastChecked: null
  });
  const [serverHealth, setServerHealth] = useState<ServerHealth>({
    isHealthy: false,
    lastChecked: null
  });

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  const loadVPSList = useCallback(async () => {
    setLoading(true);
    try {
      addLog('Carregando lista de VPS...');
      const result = await hostingerApi.listVPS();
      
      if (result.success && result.data) {
        setVpsList(result.data);
        addLog(`${result.data.length} VPS encontradas`);
        
        // Auto-selecionar primeira VPS se não houver seleção
        if (!selectedVPS && result.data.length > 0) {
          setSelectedVPS(result.data[0]);
        }
      } else {
        addLog(`Erro ao carregar VPS: ${result.error}`);
      }
    } catch (error: any) {
      addLog(`Erro na comunicação: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [selectedVPS, addLog]);

  const checkServerHealth = useCallback(async () => {
    if (!selectedVPS) return;
    
    try {
      addLog('Verificando saúde do servidor...');
      const result = await hostingerApi.testConnection();
      
      setServerHealth({
        isHealthy: result.success,
        lastChecked: new Date(),
        error: result.error
      });
      
      if (result.success) {
        addLog('✅ Servidor está saudável');
      } else {
        addLog(`❌ Problema no servidor: ${result.error}`);
      }
    } catch (error: any) {
      addLog(`Erro na verificação: ${error.message}`);
      setServerHealth({
        isHealthy: false,
        lastChecked: new Date(),
        error: error.message
      });
    }
  }, [selectedVPS, addLog]);

  const deployWhatsAppServer = useCallback(async () => {
    if (!selectedVPS) return;
    
    setOperationState(prev => ({ ...prev, isDeployingWhatsApp: true }));
    
    try {
      addLog('🚀 Iniciando deploy do servidor WhatsApp...');
      const result = await hostingerApi.installWhatsAppServer(selectedVPS.id);
      
      if (result.success) {
        addLog('✅ Deploy concluído com sucesso!');
        await checkServerHealth();
      } else {
        addLog(`❌ Erro no deploy: ${result.error}`);
      }
    } catch (error: any) {
      addLog(`💥 Erro crítico: ${error.message}`);
    } finally {
      setOperationState(prev => ({ ...prev, isDeployingWhatsApp: false }));
    }
  }, [selectedVPS, addLog, checkServerHealth]);

  const executeCommand = useCallback(async (command: string, description?: string) => {
    if (!selectedVPS) return;
    
    setOperationState(prev => ({ ...prev, isExecutingCommand: true }));
    
    try {
      addLog(`⚡ Executando: ${description || command}`);
      const result = await hostingerApi.executeCommand(selectedVPS.id, command, description);
      
      if (result.success && result.data) {
        addLog(`✅ Comando executado com sucesso`);
        addLog(`📤 Output: ${result.data.output}`);
      } else {
        addLog(`❌ Erro no comando: ${result.error}`);
      }
    } catch (error: any) {
      addLog(`💥 Erro na execução: ${error.message}`);
    } finally {
      setOperationState(prev => ({ ...prev, isExecutingCommand: false }));
    }
  }, [selectedVPS, addLog]);

  const installWhatsAppServer = useCallback(async () => {
    if (!selectedVPS) return;
    
    setOperationState(prev => ({ ...prev, isInstalling: true }));
    
    try {
      addLog('📦 Instalando servidor WhatsApp...');
      const result = await hostingerApi.installWhatsAppServer(selectedVPS.id);
      
      if (result.success) {
        addLog('✅ Instalação concluída!');
      } else {
        addLog(`❌ Erro na instalação: ${result.error}`);
      }
    } catch (error: any) {
      addLog(`💥 Erro na instalação: ${error.message}`);
    } finally {
      setOperationState(prev => ({ ...prev, isInstalling: false }));
    }
  }, [selectedVPS, addLog]);

  const applyWhatsAppFixes = useCallback(async () => {
    if (!selectedVPS) return;
    
    setOperationState(prev => ({ ...prev, isApplyingFixes: true }));
    
    try {
      addLog('🔧 Aplicando correções WhatsApp...');
      const result = await hostingerApi.applyWhatsAppFixes(selectedVPS.id);
      
      if (result.success) {
        addLog('✅ Correções aplicadas!');
      } else {
        addLog(`❌ Erro nas correções: ${result.error}`);
      }
    } catch (error: any) {
      addLog(`💥 Erro nas correções: ${error.message}`);
    } finally {
      setOperationState(prev => ({ ...prev, isApplyingFixes: false }));
    }
  }, [selectedVPS, addLog]);

  const restartVPS = useCallback(async () => {
    if (!selectedVPS) return;
    
    setOperationState(prev => ({ ...prev, isRestarting: true }));
    
    try {
      addLog('🔄 Reiniciando VPS...');
      const result = await hostingerApi.restartVPS(selectedVPS.id);
      
      if (result.success) {
        addLog('✅ VPS reiniciada!');
      } else {
        addLog(`❌ Erro no reinício: ${result.error}`);
      }
    } catch (error: any) {
      addLog(`💥 Erro no reinício: ${error.message}`);
    } finally {
      setOperationState(prev => ({ ...prev, isRestarting: false }));
    }
  }, [selectedVPS, addLog]);

  const createBackup = useCallback(async () => {
    if (!selectedVPS) return;
    
    setOperationState(prev => ({ ...prev, isCreatingBackup: true }));
    
    try {
      addLog('💾 Criando backup...');
      const result = await hostingerApi.createBackup(selectedVPS.id);
      
      if (result.success) {
        addLog('✅ Backup criado!');
      } else {
        addLog(`❌ Erro no backup: ${result.error}`);
      }
    } catch (error: any) {
      addLog(`💥 Erro no backup: ${error.message}`);
    } finally {
      setOperationState(prev => ({ ...prev, isCreatingBackup: false }));
    }
  }, [selectedVPS, addLog]);

  const loadLogs = useCallback(async () => {
    if (!selectedVPS) return;
    
    try {
      addLog('📋 Carregando logs do sistema...');
      const result = await hostingerApi.getVPSLogs(selectedVPS.id, 50);
      
      if (result.success && result.data) {
        const systemLogs = result.data.split('\n').slice(-10);
        systemLogs.forEach(log => addLog(`📋 ${log}`));
      } else {
        addLog(`❌ Erro ao carregar logs: ${result.error}`);
      }
    } catch (error: any) {
      addLog(`💥 Erro nos logs: ${error.message}`);
    }
  }, [selectedVPS, addLog]);

  return {
    vpsList,
    selectedVPS,
    setSelectedVPS,
    loading,
    operationState,
    logs,
    whatsappStatus,
    serverHealth,
    loadVPSList,
    deployWhatsAppServer,
    checkServerHealth,
    executeCommand,
    installWhatsAppServer,
    applyWhatsAppFixes,
    restartVPS,
    createBackup,
    loadLogs
  };
};
