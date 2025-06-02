
import { useState, useEffect } from 'react';
import { hostingerApi, HostingerVPS, HostingerApiResponse } from '@/services/hostinger/hostingerApiService';
import { toast } from 'sonner';

interface VPSOperationState {
  isLoading: boolean;
  isInstalling: boolean;
  isRestarting: boolean;
  isBackingUp: boolean;
  isApplyingFixes: boolean;
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
    isApplyingFixes: false
  });
  const [logs, setLogs] = useState<string>('');
  const [whatsappStatus, setWhatsappStatus] = useState<any>(null);

  // Carregar lista de VPS
  const loadVPSList = async () => {
    try {
      setLoading(true);
      const result = await hostingerApi.listVPS();
      
      if (result.success && result.data) {
        setVpsList(result.data);
        // Selecionar automaticamente a primeira VPS se não houver nenhuma selecionada
        if (!selectedVPS && result.data.length > 0) {
          setSelectedVPS(result.data[0]);
        }
        toast.success(`${result.data.length} VPS encontradas`);
      } else {
        toast.error(`Erro ao carregar VPS: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Executar comando genérico
  const executeCommand = async (command: string, description?: string) => {
    if (!selectedVPS) {
      toast.error('Nenhuma VPS selecionada');
      return null;
    }

    try {
      setOperationState(prev => ({ ...prev, isLoading: true }));
      const result = await hostingerApi.executeCommand(selectedVPS.id, command, description);
      
      if (result.success && result.data) {
        toast.success(`Comando executado: ${description || command}`);
        return result.data;
      } else {
        toast.error(`Erro ao executar comando: ${result.error}`);
        return null;
      }
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
      return null;
    } finally {
      setOperationState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Instalar WhatsApp Web.js automaticamente
  const installWhatsAppServer = async () => {
    if (!selectedVPS) {
      toast.error('Nenhuma VPS selecionada');
      return;
    }

    try {
      setOperationState(prev => ({ ...prev, isInstalling: true }));
      toast.info('Iniciando instalação automática do WhatsApp Web.js...');
      
      const result = await hostingerApi.installWhatsAppServer(selectedVPS.id);
      
      if (result.success) {
        toast.success('WhatsApp Web.js instalado com sucesso!');
        await checkWhatsAppStatus(); // Verificar status após instalação
      } else {
        toast.error(`Erro na instalação: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setOperationState(prev => ({ ...prev, isInstalling: false }));
    }
  };

  // Aplicar correções SSL e timeout
  const applyWhatsAppFixes = async () => {
    if (!selectedVPS) {
      toast.error('Nenhuma VPS selecionada');
      return;
    }

    try {
      setOperationState(prev => ({ ...prev, isApplyingFixes: true }));
      toast.info('Aplicando correções SSL e timeout...');
      
      const result = await hostingerApi.applyWhatsAppFixes(selectedVPS.id);
      
      if (result.success) {
        toast.success('Correções aplicadas com sucesso!');
        await checkWhatsAppStatus();
      } else {
        toast.error(`Erro ao aplicar correções: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setOperationState(prev => ({ ...prev, isApplyingFixes: false }));
    }
  };

  // Reiniciar VPS
  const restartVPS = async () => {
    if (!selectedVPS) {
      toast.error('Nenhuma VPS selecionada');
      return;
    }

    try {
      setOperationState(prev => ({ ...prev, isRestarting: true }));
      toast.info('Reiniciando VPS...');
      
      const result = await hostingerApi.restartVPS(selectedVPS.id);
      
      if (result.success) {
        toast.success('VPS reiniciada com sucesso!');
        // Aguardar um pouco antes de verificar status
        setTimeout(() => loadVPSList(), 10000);
      } else {
        toast.error(`Erro ao reiniciar VPS: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setOperationState(prev => ({ ...prev, isRestarting: false }));
    }
  };

  // Criar backup
  const createBackup = async () => {
    if (!selectedVPS) {
      toast.error('Nenhuma VPS selecionada');
      return;
    }

    try {
      setOperationState(prev => ({ ...prev, isBackingUp: true }));
      toast.info('Criando backup...');
      
      const result = await hostingerApi.createBackup(selectedVPS.id);
      
      if (result.success) {
        toast.success('Backup criado com sucesso!');
      } else {
        toast.error(`Erro ao criar backup: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setOperationState(prev => ({ ...prev, isBackingUp: false }));
    }
  };

  // Verificar status do WhatsApp
  const checkWhatsAppStatus = async () => {
    if (!selectedVPS) return;

    try {
      const result = await hostingerApi.checkWhatsAppStatus(selectedVPS.id);
      
      if (result.success && result.data) {
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
      const result = await hostingerApi.getVPSLogs(selectedVPS.id, lines);
      
      if (result.success && result.data) {
        setLogs(result.data);
      }
    } catch (error: any) {
      console.error('Erro ao carregar logs:', error);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadVPSList();
  }, []);

  // Verificar status do WhatsApp periodicamente
  useEffect(() => {
    if (selectedVPS) {
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
    
    // Actions
    loadVPSList,
    executeCommand,
    installWhatsAppServer,
    applyWhatsAppFixes,
    restartVPS,
    createBackup,
    checkWhatsAppStatus,
    loadLogs
  };
};
