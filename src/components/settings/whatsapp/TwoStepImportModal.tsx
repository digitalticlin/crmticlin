import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  Smartphone, 
  QrCode, 
  CheckCircle, 
  Download,
  AlertCircle,
  X,
  Wifi,
  Database,
  Import,
  RefreshCw,
  Trash2
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TwoStepImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  instanceId: string;
  instanceName: string;
}

type ImportStep = 'warning' | 'qr_scanning' | 'ready_to_import' | 'waiting_connection' | 'importing' | 'completed' | 'error';

interface ImportSession {
  sessionId?: string;
  qrCode?: string;
  status: ImportStep;
  message: string;
  error?: string;
  progress?: number;
  contactsImported?: number;
  messagesImported?: number;
  vpsStatus?: string; // Status atual da VPS
}

// Configuração das VPS disponíveis
const VPS_CONFIGS = [
  {
    url: 'http://31.97.163.57:3001',
    token: '8bb0c4f8a89d254783d693050ecd7ff4878534f46a87ece12b24f506548ce430',
    name: 'VPS Puppeteer Principal'
  },
  {
    url: 'http://31.97.24.222:3002', 
    token: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
    name: 'VPS Fallback'
  }
];

export const TwoStepImportModal: React.FC<TwoStepImportModalProps> = ({
  isOpen,
  onClose,
  instanceId,
  instanceName
}) => {
  const [session, setSession] = useState<ImportSession>({
    status: 'warning',
    message: 'Pronto para iniciar importação'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeVPS, setActiveVPS] = useState<typeof VPS_CONFIGS[0] | null>(null);
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Salvar instância Puppeteer no banco
  const upsertInstancePuppeteer = async (data: {
    instance_id: string;
    user_id: string;
    session_id: string;
    status: string;
    progress?: number;
    total_contacts?: number;
    total_messages?: number;
    error_message?: string;
    completed_at?: string;
  }) => {
    try {
      console.log('[Database] 💾 Salvando instância Puppeteer:', data);
      
      const { error } = await supabase
        .from('instances_puppeteer')
        .upsert(data, {
          onConflict: 'session_id'
        });

      if (error) {
        console.error('[Database] ❌ Erro ao salvar:', error);
      } else {
        console.log('[Database] ✅ Instância Puppeteer salva com sucesso');
      }
    } catch (error) {
      console.error('[Database] ❌ Erro geral:', error);
    }
  };

  // Detectar VPS ativa
  const detectActiveVPS = async () => {
    for (const vps of VPS_CONFIGS) {
      try {
        console.log(`[VPS Detection] 🔍 Testando: ${vps.name}`);
        const response = await fetch(`${vps.url}/health`, {
          method: 'GET',
          mode: 'cors',
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          console.log(`[VPS Detection] ✅ VPS ativa encontrada: ${vps.name}`);
          setActiveVPS(vps);
          return vps;
        }
      } catch (error) {
        console.log(`[VPS Detection] ❌ ${vps.name} indisponível`);
      }
    }
    throw new Error('Nenhuma VPS disponível');
  };

  // Buscar instância Baileys existente
  const getExistingInstance = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Usuário não autenticado');

    const { data: existingInstances, error } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('created_by_user_id', user.user.id)
      .eq('connection_type', 'web')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw new Error(`Erro ao buscar instância: ${error.message}`);
    if (!existingInstances || existingInstances.length === 0) {
      throw new Error('Nenhuma instância encontrada');
    }

    return {
      instance: existingInstances[0],
      userId: user.user.id
    };
  };

  // Verificar se já existe sessão para limpeza (SEMPRE limpa para evitar QR expirado)
  const checkAndCleanExistingSession = async (vps: typeof VPS_CONFIGS[0], instanceId: string) => {
    try {
      console.log(`[Session Check] 🔍 Verificando sessão existente para limpeza: ${instanceId}`);
      
      const response = await fetch(`${vps.url}/instance/${instanceId}/qr`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Authorization': `Bearer ${vps.token}`
        }
      });

      if (response.ok) {
        const qrData = await response.json();
        
        if (qrData.sessionId) {
          console.log(`[Session Check] 🗑️ Sessão encontrada, deletando para evitar QR expirado: ${qrData.sessionId}`);
          
          // SEMPRE deletar sessão existente para garantir QR fresco
          try {
            await fetch(`${vps.url}/session/${qrData.sessionId}`, {
              method: 'DELETE',
              mode: 'cors',
              headers: {
                'Authorization': `Bearer ${vps.token}`
              }
            });
            console.log(`[Session Check] ✅ Sessão deletada com sucesso`);
          } catch (deleteError) {
            console.log(`[Session Check] ⚠️ Erro ao deletar sessão: ${deleteError}`);
          }
          
          return { 
            exists: true, 
            sessionId: qrData.sessionId, 
            cleaned: true 
          };
        }
      }
      
      console.log(`[Session Check] ❌ Nenhuma sessão encontrada`);
      return { exists: false, cleaned: false };
      
    } catch (error) {
      console.log(`[Session Check] ❌ Erro ao verificar: ${error}`);
      return { exists: false, cleaned: false };
    }
  };

  // STEP 1: Criar instância na VPS
  const handleStartImport = async () => {
    try {
      setIsLoading(true);
      setSession({
        status: 'qr_scanning',
        message: 'Estamos criando a importação...'
      });

      // Detectar VPS ativa
      const vps = await detectActiveVPS();
      
      // Buscar instância existente
      const { instance, userId } = await getExistingInstance();
      
      // Verificar e limpar sessão existente (para garantir QR fresco)
      const sessionCheck = await checkAndCleanExistingSession(vps, instance.id);
      
      if (sessionCheck.exists) {
        console.log(`[Two-Step Import] 🗑️ Sessão antiga removida para garantir QR fresco`);
      }
       
      console.log(`[Two-Step Import] 🆕 Criando nova sessão com QR fresco...`);
       console.log(`[Two-Step Import] ✅ Instância encontrada:`, {
        id: instance.id,
        name: instance.instance_name,
        phone: instance.phone
      });

      // Criar instância na VPS
      const requestBody = {
        instanceId: instance.id,
        instanceName: instance.instance_name,
        phone: instance.phone,
        webhookUrl: 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/whatsapp_chat_import',
        userId: userId,
        action: 'puppeteer_webhook',
        importType: 'history'
      };

      console.log(`[Two-Step Import] 📤 Criando instância na VPS:`, requestBody);

      const vpsResponse = await fetch(`${vps.url}/create-instance`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${vps.token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!vpsResponse.ok) {
        throw new Error(`VPS erro: ${vpsResponse.status}`);
      }

      const vpsData = await vpsResponse.json();
      console.log(`[Two-Step Import] ✅ VPS respondeu:`, vpsData);

      if (!vpsData.success) {
        throw new Error(vpsData.message || 'Erro ao criar instância na VPS');
      }

      // Iniciar polling do QR Code
      const sessionId = vpsData.sessionId;
      
      // ✅ SALVAR NO BANCO: Instância criada
      await upsertInstancePuppeteer({
        instance_id: instance.id,
        user_id: userId,
        session_id: sessionId,
        status: 'waiting_qr'
      });
      
      setSession({
        status: 'qr_scanning',
        sessionId,
        message: 'Aguarde... Gerando QR Code'
      });

      startQRPolling(sessionId, vps);

    } catch (error: any) {
      console.error('[Two-Step Import] ❌ Erro:', error);
      setSession({
        status: 'error',
        message: 'Erro ao iniciar importação',
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Polling do QR Code
  const startQRPolling = async (sessionId: string, vps: typeof VPS_CONFIGS[0]) => {
    let attempts = 0;
    const maxAttempts = 30; // 30 tentativas * 2s = 1 minuto

    const pollQR = async () => {
      try {
        attempts++;
        console.log(`[QR Polling] 📱 Tentativa ${attempts}/${maxAttempts}`);

        const response = await fetch(`${vps.url}/instance/${instanceId}/qr`, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Authorization': `Bearer ${vps.token}`
          }
        });

        if (response.ok) {
          const qrData = await response.json();
          
          if (qrData.qrCode && qrData.isValidQr !== false) {
            console.log(`[QR Polling] 🎉 QR Code encontrado e válido!`);
            
            // Parar polling do QR
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }

            setSession(prev => ({
              ...prev,
              qrCode: qrData.qrCode,
              message: 'QR Code pronto! Escaneie com seu celular'
            }));

            // Iniciar polling de conexão
            startConnectionPolling(sessionId, vps);
            return;
          } else if (qrData.qrCode && qrData.isValidQr === false) {
            console.log(`[QR Polling] ⚠️ QR Code inválido detectado - deletando sessão...`);
            
            // Deletar sessão inválida e criar nova
            await handleDeleteAndRecreate(sessionId, vps);
            return;
          } else {
            console.log(`[QR Polling] ⏳ QR Code ainda não disponível (status: ${qrData.status})`);
          }
        }

        if (attempts >= maxAttempts) {
          console.log(`[QR Polling] ⏰ Timeout após ${maxAttempts} tentativas - deletando sessão...`);
          
          // Tentar deletar sessão que não conseguiu gerar QR
          if (session.sessionId && activeVPS) {
            try {
              await fetch(`${activeVPS.url}/session/${session.sessionId}`, {
                method: 'DELETE',
                mode: 'cors',
                headers: {
                  'Authorization': `Bearer ${activeVPS.token}`
                }
              });
            } catch (deleteError) {
              console.log(`[QR Polling] ⚠️ Erro ao deletar sessão: ${deleteError}`);
            }
          }
          
          throw new Error('Timeout ao gerar QR Code - tente novamente');
        }

      } catch (error: any) {
        console.error('[QR Polling] ❌ Erro:', error);
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        setSession({
          status: 'error',
          message: 'Erro ao obter QR Code',
          error: error.message
        });
      }
    };

    // Polling a cada 2 segundos
    pollingRef.current = setInterval(pollQR, 2000);
  };

  // Polling de conexão
  const startConnectionPolling = async (sessionId: string, vps: typeof VPS_CONFIGS[0]) => {
    let attempts = 0;
    const maxAttempts = 120; // 120 tentativas * 3s = 6 minutos (dobrado)

    const pollConnection = async () => {
      try {
        attempts++;
        console.log(`[Connection Polling] 📱 Verificando conexão ${attempts}/${maxAttempts}`);

        // ✅ TENTATIVA 1: Endpoint principal de status
        let response = await fetch(`${vps.url}/session-status/${sessionId}`, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Authorization': `Bearer ${vps.token}`
          }
        });

        // ✅ TENTATIVA 2: Endpoint alternativo se o principal falhar
        if (!response.ok) {
          // Extrair instanceId do sessionId (formato: puppeteer_instanceId_timestamp)
          const extractedInstanceId = sessionId.split('_')[1];
          console.log(`[Connection Polling] 🔄 Tentando endpoint alternativo: /instance/${extractedInstanceId}/status`);
          
          response = await fetch(`${vps.url}/instance/${extractedInstanceId}/status`, {
            method: 'GET',
            mode: 'cors',
            headers: {
              'Authorization': `Bearer ${vps.token}`
            }
          });
        }

        if (response.ok) {
          const statusData = await response.json();
          console.log(`[Connection Polling] 📱 Status completo:`, statusData);
          console.log(`[Connection Polling] 📱 Status específico:`, statusData.session?.status);

          const currentStatus = statusData.session?.status;
          
          // 🔍 DEBUG COMPLETO: Log todos os dados para investigar
          if (attempts <= 3) {
            console.log(`[Connection Polling] 🔍 DEBUG COMPLETO - Tentativa ${attempts}:`, {
              statusData: statusData,
              currentStatus: currentStatus,
              sessionObject: statusData.session,
              allKeys: statusData ? Object.keys(statusData) : 'No statusData'
            });
          }
          
          // Status que indicam conexão estabelecida (EXPANDIDO)
          const connectedStatuses = [
            'connected', 
            'authenticated', 
            'ready', 
            'online', 
            'logged_in',
            'active',
            'connected_web',
            'importing',  // Algumas VPS mudam direto para importing
            'waiting_import'
          ];
          
          if (connectedStatuses.includes(currentStatus)) {
            console.log(`[Connection Polling] 🎉 WhatsApp conectado! Status: ${currentStatus}`);
            
            // Parar polling
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }

            // ✅ SALVAR NO BANCO: Conexão estabelecida
            const { instance, userId } = await getExistingInstance();
            await upsertInstancePuppeteer({
              instance_id: instance.id,
              user_id: userId,
              session_id: sessionId,
              status: 'connected'
            });

            // MODAL 3: Tudo pronto para importar
            setSession({
              status: 'ready_to_import',
              sessionId,
              message: 'Telefone conectado! Pronto para importar'
            });
            return;
          }
          
          // 🔍 VERIFICAÇÃO ALTERNATIVA: Diferentes estruturas de dados da VPS
          const alternativeStatus = statusData.status || statusData.connectionStatus || statusData.whatsappStatus;
          const isConnectedByField = statusData.isConnected || statusData.connected || statusData.authenticated;
          
          if (alternativeStatus && connectedStatuses.includes(alternativeStatus)) {
            console.log(`[Connection Polling] 🎉 WhatsApp conectado via campo alternativo! Status: ${alternativeStatus}`);
            
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }

            const { instance, userId } = await getExistingInstance();
            await upsertInstancePuppeteer({
              instance_id: instance.id,
              user_id: userId,
              session_id: sessionId,
              status: 'connected'
            });

            setSession({
              status: 'ready_to_import',
              sessionId,
              message: 'Telefone conectado! Pronto para importar'
            });
            return;
          }
          
          if (isConnectedByField === true) {
            console.log(`[Connection Polling] 🎉 WhatsApp conectado via flag booleana!`);
            
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }

            const { instance, userId } = await getExistingInstance();
            await upsertInstancePuppeteer({
              instance_id: instance.id,
              user_id: userId,
              session_id: sessionId,
              status: 'connected'
            });

            setSession({
              status: 'ready_to_import',
              sessionId,
              message: 'Telefone conectado! Pronto para importar'
            });
            return;
          }

          // Status de erro que devem parar o polling
          if (currentStatus === 'connection_timeout' || currentStatus === 'error' || currentStatus === 'qr_error') {
            console.log(`[Connection Polling] ❌ Erro detectado: ${currentStatus}`);
            
            // Parar polling
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }

            setSession({
              status: 'error',
              message: `Erro: ${currentStatus}`,
              error: statusData.session?.message || 'Erro na conexão'
            });
            return;
          }
          
          // Log para outros status e atualizar interface
          if (currentStatus !== 'qr_ready') {
            console.log(`[Connection Polling] 📱 Status intermédio: ${currentStatus}`);
          }
          
          // Atualizar interface com status atual
          setSession(prev => ({
            ...prev,
            vpsStatus: currentStatus,
            message: statusData.session?.message || prev.message
          }));
        }

        if (attempts >= maxAttempts) {
          throw new Error('Timeout aguardando conexão');
        }

      } catch (error: any) {
        console.error('[Connection Polling] ❌ Erro:', error);
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        setSession({
          status: 'error',
          message: 'Timeout na conexão',
          error: error.message
        });
      }
    };

    // Polling a cada 3 segundos
    pollingRef.current = setInterval(pollConnection, 3000);
  };

  // Deletar sessão e recriar (força novo QR Code)
  const handleDeleteAndRecreate = async (sessionId: string, vps: typeof VPS_CONFIGS[0]) => {
    try {
      console.log(`[Delete & Recreate] 🔄 Deletando sessão inválida: ${sessionId}`);
      
      // Deletar sessão atual
      const deleteResponse = await fetch(`${vps.url}/session/${sessionId}`, {
        method: 'DELETE',
        mode: 'cors',
        headers: {
          'Authorization': `Bearer ${vps.token}`
        }
      });

      if (deleteResponse.ok) {
        console.log(`[Delete & Recreate] ✅ Sessão deletada, criando nova...`);
        
        // Recriar instância (vai gerar novo sessionId e QR Code)
        await handleStartImport();
      } else {
        throw new Error('Falha ao deletar sessão inválida');
      }

    } catch (error: any) {
      console.error('[Delete & Recreate] ❌ Erro:', error);
      setSession(prev => ({
        ...prev,
        status: 'error',
        message: 'Erro ao renovar QR Code',
        error: error.message
      }));
    }
  };

  // Regenerar QR Code (deleta sessão atual e cria nova)
  const handleRefreshQR = async () => {
    if (!session.sessionId || !activeVPS) return;

    try {
      setIsLoading(true);
      console.log(`[Refresh QR] 🔄 Forçando novo QR Code...`);

      // Parar polling atual
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }

      // Deletar e recriar sessão (força novo QR Code)
      await handleDeleteAndRecreate(session.sessionId, activeVPS);

    } catch (error: any) {
      console.error('[Refresh QR] ❌ Erro:', error);
      setSession(prev => ({
        ...prev,
        status: 'error',
        message: `Erro ao gerar novo QR Code: ${error.message}`,
        error: error.message
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Deletar sessão na VPS
  const handleDeleteSession = async () => {
    if (!session.sessionId || !activeVPS) return;

    try {
      setIsLoading(true);
      console.log(`[Delete Session] 🗑️ Deletando sessão: ${session.sessionId}`);

      // Parar polling se estiver ativo
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }

      const response = await fetch(`${activeVPS.url}/session/${session.sessionId}`, {
        method: 'DELETE',
        mode: 'cors',
        headers: {
          'Authorization': `Bearer ${activeVPS.token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ao deletar sessão: ${response.status}`);
      }

      const deleteData = await response.json();
      console.log(`[Delete Session] ✅ Sessão deletada:`, deleteData);

      // Fechar modal após deletar
      handleClose();

    } catch (error: any) {
      console.error('[Delete Session] ❌ Erro:', error);
      setSession(prev => ({
        ...prev,
        status: 'error',
        message: `Erro ao deletar sessão: ${error.message}`,
        error: error.message
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ NOVA FUNÇÃO ISOLADA: Verificar status da instância na VPS
  const checkInstanceStatus = async (): Promise<string> => {
    try {
      if (!session.sessionId || !activeVPS) {
        throw new Error('Session ID ou VPS não disponível');
      }

      console.log(`[Connection Monitor] 🔍 Verificando status da instância: ${session.sessionId}`);
      
      const response = await fetch(`${activeVPS.url}/session-status/${session.sessionId}`, {
            method: 'GET',
            mode: 'cors',
            headers: {
              'Authorization': `Bearer ${activeVPS.token}`
            }
          });

      if (response.ok) {
        const data = await response.json();
        const status = data.session?.status || data.status || 'unknown';
        console.log(`[Connection Monitor] 📊 Status atual: ${status}`);
        return status;
      } else {
        console.log(`[Connection Monitor] ⚠️ Erro ao verificar status: ${response.status}`);
        return 'error';
      }
    } catch (error: any) {
      console.error(`[Connection Monitor] ❌ Erro na verificação:`, error);
      return 'error';
    }
  };

  // ✅ NOVA FUNÇÃO ISOLADA: Monitorar conexão até conectar
  const startConnectionMonitoring = async () => {
    console.log(`[Connection Monitor] 🚀 Iniciando monitoramento de conexão`);
    
    const POLL_INTERVAL = 3000; // 3 segundos
    const MAX_ATTEMPTS = 20;     // 60 segundos total
    const CONNECTED_STATUSES = ['connected', 'ready', 'authenticated', 'online'];
    
    let attempts = 0;
    let monitoringInterval: number | null = null;

    const stopMonitoring = () => {
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
        monitoringInterval = null;
      }
    };

    return new Promise<boolean>((resolve, reject) => {
      const checkConnection = async () => {
        attempts++;
        console.log(`[Connection Monitor] 🔄 Tentativa ${attempts}/${MAX_ATTEMPTS}`);
        
        setSession(prev => ({
          ...prev,
          message: `Aguardando conexão... (${attempts}/${MAX_ATTEMPTS})`
        }));

        try {
          const status = await checkInstanceStatus();
          
          if (CONNECTED_STATUSES.includes(status)) {
            console.log(`[Connection Monitor] ✅ Conexão estabelecida! Status: ${status}`);
            stopMonitoring();
            resolve(true);
            return;
          }

          if (status === 'error' || attempts >= MAX_ATTEMPTS) {
            console.log(`[Connection Monitor] ❌ Timeout ou erro. Status: ${status}, Tentativas: ${attempts}`);
            stopMonitoring();
            reject(new Error(`Timeout na conexão após ${attempts} tentativas. Status final: ${status}`));
            return;
          }

          console.log(`[Connection Monitor] ⏳ Status ainda: ${status}, continuando...`);
          
        } catch (error: any) {
          console.error(`[Connection Monitor] ❌ Erro na tentativa ${attempts}:`, error);
          
          if (attempts >= MAX_ATTEMPTS) {
            stopMonitoring();
            reject(error);
            return;
          }
        }
      };

      // Primeira verificação imediata
      checkConnection();
      
      // Polling a cada 3 segundos
      monitoringInterval = window.setInterval(checkConnection, POLL_INTERVAL);
    });
  };

  // ✅ NOVA FUNÇÃO ISOLADA: Iniciar importação direta
  const startImportDirectly = async () => {
    console.log(`[Direct Import] 🚀 Iniciando importação direta`);
    
        setSession(prev => ({
          ...prev,
      status: 'importing',
      message: 'Iniciando importação...'
    }));

    // ✅ BUSCAR DADOS COMPLETOS DA INSTÂNCIA
    const { instance, userId } = await getExistingInstance();

    // ✅ ENDPOINTS PARA IMPORTAÇÃO
      const importEndpoints = [
        {
          name: 'Start Import - Endpoint principal',
          url: `${activeVPS.url}/start-import`,
          body: {
            sessionId: session.sessionId,
            instanceId: instance.id,
            instanceName: instance.instance_name,
            phone: instance.phone,
            webhookUrl: 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/whatsapp_chat_import',
            userId: userId,
            action: 'history_import',
          force: true,
          userForced: true,
          directImport: true,
          monitoredConnection: true // NOVO: Indica que conexão foi monitorada
          }
        },
        {
          name: 'Create Instance com importação',
          url: `${activeVPS.url}/create-instance`,
          body: {
            instanceId: instance.id,
            instanceName: instance.instance_name,
            phone: instance.phone,
            webhookUrl: 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/whatsapp_chat_import',
            userId: userId,
            action: 'start_import',
            existingSession: session.sessionId,
            forceImport: true,
          userForced: true,
          directImport: true,
          monitoredConnection: true // NOVO: Indica que conexão foi monitorada
          }
        }
      ];

      let importData = null;
      let lastError = null;

      for (const endpoint of importEndpoints) {
        try {
        console.log(`[Direct Import] 📤 ${endpoint.name} - ${endpoint.url}`);

          const response = await fetch(endpoint.url, {
            method: 'POST',
            mode: 'cors',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${activeVPS.token}`
            },
            body: JSON.stringify(endpoint.body)
          });

          if (response.ok) {
            const responseData = await response.json();
          console.log(`[Direct Import] ✅ ${endpoint.name} funcionou:`, responseData);
            
            if (responseData.success) {
              importData = responseData;
            break;
            } else {
              lastError = responseData.error || 'Resposta indica falha';
            }
          } else {
          const errorData = await response.json().catch(() => ({}));
              lastError = errorData.error || errorData.message || response.statusText;
          console.log(`[Direct Import] ❌ ${endpoint.name} falhou:`, lastError);
          }
        } catch (error: any) {
        console.log(`[Direct Import] ❌ ${endpoint.name} erro de rede:`, error.message);
          lastError = error.message;
        }
      }

      if (!importData || !importData.success) {
      throw new Error(`Falha na importação: ${lastError}`);
    }

    return importData;
  };

  // STEP 2: Iniciar importação (FUNÇÃO MODIFICADA)
  const handleStartHistoryImport = async () => {
    setIsLoading(true);
    
    try {
      console.log(`[History Import] 🚀 NOVA LÓGICA: Iniciando importação inteligente para sessionId: ${session.sessionId}`);

      // ✅ BUSCAR DADOS COMPLETOS DA INSTÂNCIA
      const { instance, userId } = await getExistingInstance();

      // ✅ VERIFICAR STATUS ATUAL DA INSTÂNCIA
      const currentStatus = await checkInstanceStatus();
      console.log(`[History Import] 📊 Status atual da instância: ${currentStatus}`);
      console.log(`[History Import] 🔍 DEBUG TIMING: Status verificado imediatamente após polling que detectou 'connected'`);
      
      // ✅ DEBUG: Verificar se há diferença entre status do polling e status atual
      const lastPollingStatus = 'connected'; // O polling detectou connected
      if (currentStatus !== lastPollingStatus) {
        console.log(`[History Import] ⚠️ TIMING ISSUE: Polling detectou '${lastPollingStatus}' mas checkInstanceStatus retornou '${currentStatus}'`);
        console.log(`[History Import] 🔄 Isso pode indicar que a VPS mudou o status automaticamente ou há race condition`);
      }

      // ✅ DECISÃO BASEADA NO STATUS
      if (['connected', 'ready', 'authenticated', 'online', 'completed'].includes(currentStatus)) {
        // Status já conectado → Importar direto
        console.log(`[History Import] ✅ Instância já conectada, importando direto`);
        
        const importData = await startImportDirectly();

      setSession(prev => ({
        ...prev,
        status: 'importing',
        message: 'Importação em andamento... Acompanhe via webhook'
      }));

      toast({
          title: "🚀 Importação Iniciada com Sucesso",
        description: "O histórico está sendo importado. Você receberá notificação quando concluir.",
      });

      // Auto-fechar após 3 segundos
      setTimeout(() => {
        onClose();
      }, 3000);
        
      } else if (currentStatus === 'initializing') {
        // Status inicializando → Aguardar conexão
        console.log(`[History Import] ⏳ Instância inicializando, aguardando conexão automática`);
        
        setSession(prev => ({
          ...prev,
          status: 'waiting_connection',
          message: 'QR escaneado! Aguardando WhatsApp sincronizar...'
        }));

        // Aguardar conexão com monitoramento
        await startConnectionMonitoring();
        
        // Conexão estabelecida, iniciar importação
        console.log(`[History Import] ✅ Conexão monitorada estabelecida, iniciando importação`);
        
        const importData = await startImportDirectly();
        
        setSession(prev => ({
          ...prev,
          status: 'importing',
          message: 'Importação em andamento... Acompanhe via webhook'
        }));

        toast({
          title: "🎉 Conexão Estabelecida + Importação Iniciada",
          description: "WhatsApp conectado! O histórico está sendo importado.",
        });

        // Auto-fechar após 3 segundos
        setTimeout(() => {
          onClose();
        }, 3000);
        
      } else {
        // ✅ CORREÇÃO: Status não conectado → Mostrar mensagem que importação começará em breve
        console.log(`[History Import] 📅 Status não conectado (${currentStatus}), configurando importação agendada`);
        
        // ✅ SALVAR INTENÇÃO DE IMPORTAÇÃO no banco
        await upsertInstancePuppeteer({
          instance_id: instance.id,
          user_id: userId,
          session_id: session.sessionId,
          status: 'importing'
        });

        // ✅ CONFIGURAR VPS PARA IMPORTAR AUTOMATICAMENTE QUANDO CONECTAR
        try {
          const scheduleResponse = await fetch(`${activeVPS.url}/schedule-import`, {
            method: 'POST',
            mode: 'cors',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${activeVPS.token}`
            },
            body: JSON.stringify({
              sessionId: session.sessionId,
              instanceId: instance.id,
              webhookUrl: 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/whatsapp_chat_import',
              userId: userId,
              waitForConnection: true,
              autoImportOnConnect: true
            })
          });

          if (scheduleResponse.ok) {
            const scheduleData = await scheduleResponse.json();
            console.log(`[History Import] ✅ Importação agendada na VPS:`, scheduleData);
          } else {
            console.log(`[History Import] ⚠️ Erro ao agendar na VPS, mas continuando...`);
          }
        } catch (scheduleError) {
          console.log(`[History Import] ⚠️ Erro de rede ao agendar importação:`, scheduleError);
        }

        // ✅ MOSTRAR MENSAGEM DE IMPORTAÇÃO AGENDADA
        setSession(prev => ({
          ...prev,
          status: 'importing',
          message: 'A IMPORTAÇÃO COMEÇARÁ EM BREVE - Você será notificado quando a instância conectar e a importação iniciar!'
        }));

        toast({
          title: "📅 Importação Agendada",
          description: "A importação começará automaticamente quando o WhatsApp conectar. Você será notificado!",
          duration: 8000
        });

        // Auto-fechar após 5 segundos
        setTimeout(() => {
          onClose();
        }, 5000);
      }

    } catch (error: any) {
      console.error('[History Import] ❌ Erro na importação inteligente:', error);
      setSession(prev => ({
        ...prev,
        status: 'error',
        message: `Erro na importação: ${error.message}`,
        error: error.message
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup
  const handleClose = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setSession({
      status: 'warning',
      message: 'Pronto para iniciar importação'
    });
    onClose();
  };

  // Renderizar modal baseado no status
  const renderModalContent = () => {
    switch (session.status) {
      case 'warning':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="bg-blue-50 p-6 rounded-lg">
                <Import className="h-12 w-12 mx-auto text-blue-600 mb-3" />
                <h3 className="font-semibold text-blue-900 text-lg">Importar Histórico do WhatsApp</h3>
                <p className="text-sm text-blue-700 mt-2">
                  Vamos importar TODO o histórico de conversas da sua instância <strong>{instanceName}</strong>
                </p>
              </div>
              
              <div className="bg-amber-50 p-4 rounded border border-amber-200">
                <p className="text-sm text-amber-800">
                  <strong>ℹ️ Como funciona:</strong><br />
                  1. Será criada uma conexão temporária<br />
                  2. Você escaneará um QR Code<br />
                  3. Importaremos todo o histórico<br />
                  4. Depois você pode excluir a conexão do celular
                </p>
              </div>

              <Button
                onClick={handleStartImport}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Preparando...
                  </>
                ) : (
                  <>
                    <Import className="h-4 w-4 mr-2" />
                    IMPORTAR CHAT
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case 'qr_scanning':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                {session.qrCode ? (
                  <QrCode className="h-8 w-8 text-green-500" />
                ) : (
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                )}
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900">
                  {session.qrCode ? 'QR Code Pronto!' : 'Estamos criando a importação...'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {session.message}
                </p>
                {session.qrCode && (
                  <div className="text-xs text-blue-600 mt-2 space-y-1">
                    <p>🔄 Aguardando escaneamento... (verificando conexão automaticamente)</p>
                    {session.vpsStatus && (
                      <p className="bg-blue-50 px-2 py-1 rounded">
                        Status VPS: <span className="font-mono">{session.vpsStatus}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {session.qrCode && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border-2 border-green-200 inline-block">
                    <img 
                      src={session.qrCode} 
                      alt="QR Code WhatsApp" 
                      className="w-48 h-48 mx-auto"
                    />
                  </div>
                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <p className="text-sm text-green-800">
                      <strong>📱 Escaneie agora:</strong><br />
                      WhatsApp → Menu (⋮) → Dispositivos conectados → Conectar dispositivo
                    </p>
                  </div>
                  
                  {/* Botões de ação */}
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      onClick={handleRefreshQR}
                      disabled={isLoading}
                      className="border-blue-300 text-blue-700 hover:bg-blue-50 text-xs"
                    >
                      {isLoading ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3 mr-1" />
                      )}
                      Novo QR
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => {
                        console.log(`[Force Connect] 🔧 Usuário forçou conexão`);
                        
                        // ✅ PARAR POLLING ANTES DE FORÇAR CONEXÃO
                        if (pollingRef.current) {
                          clearInterval(pollingRef.current);
                          pollingRef.current = null;
                          console.log(`[Force Connect] 🛑 Polling parado`);
                        }
                        
                        setSession({
                          status: 'ready_to_import',
                          sessionId: session.sessionId,
                          message: 'Conexão forçada pelo usuário'
                        });
                      }}
                      disabled={isLoading}
                      className="border-green-300 text-green-700 hover:bg-green-50 text-xs"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Forçar
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={handleDeleteSession}
                      disabled={isLoading}
                      className="border-red-300 text-red-700 hover:bg-red-50 text-xs"
                    >
                      {isLoading ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3 mr-1" />
                      )}
                      Delete
                    </Button>
                  </div>
                  
                  <div className="bg-blue-50 p-2 rounded text-xs text-blue-700">
                    <strong>🔧 Debug:</strong> Se já escaneou o QR mas não conectou, clique em "Forçar"
                  </div>
                </div>
              )}

              <Button variant="outline" onClick={handleClose} className="w-full">
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        );

      case 'ready_to_import':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              
              <div>
                <h3 className="font-semibold text-green-900 text-lg">📱 TUDO PRONTO!</h3>
                <p className="text-sm text-green-700 mt-1">
                  Telefone conectado com sucesso! Agora podemos importar todo o histórico.
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded border border-green-200">
                <p className="text-sm text-green-800">
                  <strong>✅ Conexão estabelecida!</strong><br />
                  Clique no botão abaixo para iniciar a importação do histórico completo.
                </p>
              </div>

              <Button
                onClick={handleStartHistoryImport}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Iniciando...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    🚀 Iniciar Importação
                  </>
                )}
              </Button>

              <Button variant="outline" onClick={handleClose} className="w-full">
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        );

      case 'waiting_connection':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              </div>
              
              <div>
                <h3 className="font-semibold text-blue-900 text-lg">⏳ Aguardando Conexão</h3>
                <p className="text-sm text-blue-700 mt-1">
                  QR Code foi escaneado! Aguardando WhatsApp sincronizar completamente...
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>📱 Status:</strong> {session.message}<br />
                  <strong>🔄 Processo:</strong> Monitorando conexão automaticamente<br />
                  <strong>⚡ Próximo:</strong> Importação iniciará assim que conectar
                </p>
              </div>

              <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                <p className="text-xs text-yellow-800">
                  <strong>💡 Dica:</strong> Este processo pode levar até 60 segundos. A importação iniciará automaticamente quando o WhatsApp estiver pronto.
                </p>
              </div>

              <Button variant="outline" onClick={handleClose} className="w-full">
                <X className="h-4 w-4 mr-2" />
                Cancelar (monitoramento continuará)
              </Button>
            </div>
          </div>
        );

      case 'importing':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Database className="h-8 w-8 animate-pulse text-blue-500" />
              </div>
              
              <div>
                <h3 className="font-semibold text-blue-900">Importando Histórico</h3>
                <p className="text-sm text-blue-700 mt-1">
                  {session.message}
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>🔄 Importação em andamento</strong><br />
                  O processo pode levar alguns minutos. Você receberá uma notificação quando concluir.
                </p>
              </div>

              <Button onClick={handleClose} className="w-full">
                <CheckCircle className="h-4 w-4 mr-2" />
                Fechar (importação continua)
              </Button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              
              <div>
                <h3 className="font-semibold text-red-900">Erro na Importação</h3>
                <p className="text-sm text-red-700 mt-1">
                  {session.error || session.message}
                </p>
              </div>

              <div className="bg-red-50 p-4 rounded border border-red-200">
                <p className="text-sm text-red-800">
                  Ocorreu um erro durante o processo. Tente novamente em alguns minutos.
                </p>
              </div>

              <Button onClick={handleClose} className="w-full">
                <X className="h-4 w-4 mr-2" />
                Fechar
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            Importação de Histórico
          </DialogTitle>
          <DialogDescription>
            Modal para importação completa do histórico de mensagens do WhatsApp usando conexão via web.
          </DialogDescription>
        </DialogHeader>

        {renderModalContent()}
      </DialogContent>
    </Dialog>
  );
}; 