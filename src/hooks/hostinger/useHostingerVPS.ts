
import { useState, useCallback } from 'react';
import { WhatsAppWebService } from '@/services/whatsapp/whatsappWebService';

interface DiagnosticState {
  isRunning: boolean;
  logs: string[];
  lastSuccess: Date | null;
  lastError: string | null;
}

export const useHostingerVPS = () => {
  const [diagnostic, setDiagnostic] = useState<DiagnosticState>({
    isRunning: false,
    logs: [],
    lastSuccess: null,
    lastError: null,
  });

  const addLog = useCallback((log: string) => {
    setDiagnostic(prev => ({ ...prev, logs: [...prev.logs, log] }));
  }, []);

  const resetLogs = useCallback(() => {
    setDiagnostic(prev => ({ ...prev, logs: [] }));
  }, []);

  const diagnoseWhatsAppIntegration = async () => {
    setDiagnostic(prev => ({ ...prev, isRunning: true, logs: [] }));
    
    try {
      addLog('🔍 Iniciando diagnóstico da integração WhatsApp...');
      
      // Step 1: Check server health
      addLog('🩺 Verificando saúde do servidor...');
      const serverHealth = await WhatsAppWebService.checkServerHealth();
      
      if (serverHealth.success) {
        addLog('✅ Servidor está saudável');
      } else {
        addLog(`❌ Servidor está com problemas: ${serverHealth.error}`);
      }

      // Step 2: Check VPS Status
      addLog('🖥️ Verificando status do VPS...');
      // Removido teste da API Hostinger que foi deletada
      addLog('ℹ️ API Hostinger removida - usando verificação manual');

      // Step 3: Check if WhatsApp instances on VPS
      addLog('📱 Verificando instâncias WhatsApp no VPS...');
      const serverInfo = await WhatsAppWebService.getServerInfo();
      
      if (serverInfo.success) {
        const instances = serverInfo.data?.instances || [];
        addLog(`✅ ${instances.length} instâncias encontradas no VPS`);
        
        if (instances.length > 0) {
          instances.forEach((instance: any, index: number) => {
            addLog(`   📱 ${index + 1}. ${instance.instanceName} - Status: ${instance.status}`);
          });
        }
      } else {
        addLog(`❌ Erro ao buscar instâncias: ${serverInfo.error}`);
      }

      addLog('✅ Diagnóstico concluído com sucesso!');
      setDiagnostic(prev => ({ 
        ...prev, 
        isRunning: false, 
        lastSuccess: new Date() 
      }));

    } catch (error: any) {
      addLog(`💥 Erro no diagnóstico: ${error.message}`);
      setDiagnostic(prev => ({ 
        ...prev, 
        isRunning: false, 
        lastError: error.message 
      }));
    }
  };

  return {
    diagnostic,
    diagnoseWhatsAppIntegration,
    resetLogs
  };
};
