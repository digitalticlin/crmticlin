import { useState, useCallback } from 'react';
import { WhatsAppWebService } from '@/services/whatsapp/whatsappWebService';
import { HostingerApiService } from '@/services/hostinger/hostingerApiService';

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

      // Step 2: Check Hostinger API Key
      addLog('🔑 Verificando chave da API Hostinger...');
      const apiKey = process.env.NEXT_PUBLIC_HOSTINGER_API_KEY;
      
      if (apiKey) {
        addLog('✅ Chave da API Hostinger encontrada');
      } else {
        addLog('❌ Chave da API Hostinger não configurada');
      }

      // Step 3: Check Hostinger Account ID
      addLog('🆔 Verificando ID da conta Hostinger...');
      const accountId = process.env.NEXT_PUBLIC_HOSTINGER_ACCOUNT_ID;
      
      if (accountId) {
        addLog('✅ ID da conta Hostinger encontrado');
      } else {
        addLog('❌ ID da conta Hostinger não configurado');
      }

      // Step 4: Check Hostinger API connection
      addLog('📡 Testando conexão com a API Hostinger...');
      const apiStatus = await HostingerApiService.checkApiStatus();
      
      if (apiStatus.success) {
        addLog('✅ Conexão com a API Hostinger estabelecida');
      } else {
        addLog(`❌ Falha na conexão com a API Hostinger: ${apiStatus.error}`);
      }

      // Step 5: Check VPS Status
      addLog('🖥️ Verificando status do VPS...');
      const vpsStatus = await HostingerApiService.getVpsStatus();
      
      if (vpsStatus.success) {
        addLog(`✅ VPS está ${vpsStatus.status}`);
      } else {
        addLog(`❌ Falha ao obter status do VPS: ${vpsStatus.error}`);
      }

      // Step 6: Check if domain is configured
      addLog('🌐 Verificando se o domínio está configurado...');
      const domainStatus = await HostingerApiService.getDomainStatus();
      
      if (domainStatus.success) {
        addLog('✅ Domínio configurado corretamente');
      } else {
        addLog(`❌ Domínio não configurado: ${domainStatus.error}`);
      }

      // Step 7: Check if SSL is active
      addLog('🔒 Verificando se o SSL está ativo...');
      const sslStatus = await HostingerApiService.getSslStatus();
      
      if (sslStatus.success) {
        addLog('✅ SSL está ativo');
      } else {
        addLog(`❌ SSL não está ativo: ${sslStatus.error}`);
      }

      // Step 8: Check Firewall Status
      addLog('🛡️ Verificando status do Firewall...');
      const firewallStatus = await HostingerApiService.getFirewallStatus();
      
      if (firewallStatus.success) {
        addLog('✅ Firewall está ativo');
      } else {
        addLog(`❌ Firewall não está ativo: ${firewallStatus.error}`);
      }

      // Step 9: Check Backups Status
      addLog('💾 Verificando status dos Backups...');
      const backupsStatus = await HostingerApiService.getBackupsStatus();
      
      if (backupsStatus.success) {
        addLog('✅ Backups estão ativos');
      } else {
        addLog(`❌ Backups não estão ativos: ${backupsStatus.error}`);
      }

      // Step 10: Check WhatsApp instances on VPS
      addLog('📱 Verificando instâncias WhatsApp no VPS...');
      const serverInfo = await WhatsAppWebService.getServerInfo();
      
      if (serverInfo.success) {
        const instances = serverInfo.instances || [];
        addLog(`✅ ${instances.length} instâncias encontradas no VPS`);
        
        if (instances.length > 0) {
          instances.forEach((instance, index) => {
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
