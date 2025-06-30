import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// 🔧 CONFIGURAÇÃO CORRIGIDA - Detecção automática de VPS ativa
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

// 🔍 Função para detectar VPS ativa
async function detectActiveVPS(): Promise<typeof VPS_CONFIGS[0] | null> {
  console.log('[VPS Detection] 🔍 Detectando VPS ativa...');
  
  for (const config of VPS_CONFIGS) {
    try {
      console.log(`[VPS Detection] 🧪 Testando: ${config.name} - ${config.url}`);
      
      const response = await fetch(`${config.url}/health`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.token}`
        },
        signal: AbortSignal.timeout(5000) // Timeout de 5s
      });

      if (response.ok) {
        console.log(`[VPS Detection] ✅ VPS ativa encontrada: ${config.name}`);
        return config;
      }
    } catch (error) {
      console.log(`[VPS Detection] ❌ ${config.name} indisponível:`, error.message);
    }
  }
  
  console.error('[VPS Detection] 🚨 Nenhuma VPS disponível!');
  return null;
}

export type PuppeteerStatus = 
  | 'preparing'      // Preparando importação
  | 'creating'       // Criando sessão na VPS
  | 'generating_qr'  // Gerando QR Code
  | 'qr_ready'       // QR Code pronto para escaneamento
  | 'connected'      // WhatsApp conectado
  | 'importing'      // Importando histórico
  | 'completed'      // Importação concluída
  | 'error'          // Erro
  | 'timeout';       // Timeout

interface PuppeteerImportSession {
  sessionId: string;
  instanceId: string;
  status: PuppeteerStatus;
  qrCode?: string;
  progress?: number;
  message?: string;
  error?: string;
  contactsImported?: number;
  messagesImported?: number;
}

interface UsePuppeteerImportResult {
  session: PuppeteerImportSession | null;
  isLoading: boolean;
  createSession: (instanceId: string, instanceName: string) => Promise<void>;
  restartPolling: () => void;
  closeSession: () => void;
}

export function usePuppeteerImport(): UsePuppeteerImportResult {
  const [session, setSession] = useState<PuppeteerImportSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const attemptsRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // 🚀 Criar nova sessão de importação (REQUISIÇÃO DIRETA À VPS)
  const createSession = async (instanceId: string, instanceName: string) => {
    try {
      setIsLoading(true);
      
      // Estado 1: Preparando importação
      setSession({
        sessionId: '',
        instanceId,
        status: 'preparing',
        message: 'Preparando importação...'
      });

      await new Promise(resolve => setTimeout(resolve, 1500)); // UX: pausa dramática

      // Estado 2: Buscando instância existente
      setSession(prev => ({
        ...prev!,
        status: 'creating',
        message: 'Buscando instância existente...'
      }));

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Usuário não autenticado');
      }

      const userId = user.user.id;

      // 🔍 BUSCAR INSTÂNCIA BAILEYS EXISTENTE DO USUÁRIO
      console.log(`[Puppeteer Import] 🔍 Buscando instância Baileys existente do usuário: ${userId}`);
      
      const { data: existingInstances, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('created_by_user_id', userId)
        .eq('connection_type', 'web') // Baileys = web
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError) {
        throw new Error(`Erro ao buscar instância existente: ${fetchError.message}`);
      }

      if (!existingInstances || existingInstances.length === 0) {
        throw new Error('Nenhuma instância Baileys encontrada. Crie uma instância primeiro.');
      }

      const existingInstance = existingInstances[0];
      console.log(`[Puppeteer Import] ✅ Instância encontrada:`, {
        id: existingInstance.id,
        name: existingInstance.instance_name,
        phone: existingInstance.phone,
        created_by: existingInstance.created_by_user_id
      });

      // ✅ USAR OS DADOS DA INSTÂNCIA EXISTENTE
      const puppeteerInstanceId = existingInstance.id; // Mesmo ID para evitar duplicidade
      const puppeteerInstanceName = existingInstance.instance_name; // Mesmo nome
      const puppeteerPhone = existingInstance.phone; // Mesmo número
      const puppeteerUserId = existingInstance.created_by_user_id; // Mesmo usuário

      // Estado 3: Detectando VPS ativa
      setSession(prev => ({
        ...prev!,
        status: 'creating',
        message: 'Detectando servidor Puppeteer...'
      }));

      // 🔍 DETECÇÃO AUTOMÁTICA DE VPS ATIVA
      const activeVPS = await detectActiveVPS();
      
      if (!activeVPS) {
        throw new Error('Nenhuma VPS Puppeteer está ativa no momento');
      }

      console.log(`[Puppeteer Import] 🎯 Usando VPS: ${activeVPS.name} - ${activeVPS.url}`);

      // Estado 4: Criando sessão na VPS
      setSession(prev => ({
        ...prev!,
        status: 'creating',
        message: 'Criando sessão na VPS...'
      }));

      await new Promise(resolve => setTimeout(resolve, 1000)); // UX: pausa dramática

      console.log(`[Puppeteer Import] 🚀 Criando sessão DIRETA na VPS para instanceId: ${puppeteerInstanceId}`);

      // 🌐 REQUISIÇÃO DIRETA À VPS para criar instância
      const createUrl = `${activeVPS.url}/create-instance`;
      const requestBody = {
        instanceId: puppeteerInstanceId, // ✅ Mesmo ID da instância Baileys
        instanceName: puppeteerInstanceName, // ✅ Mesmo nome da instância Baileys
        phone: puppeteerPhone, // ✅ Mesmo número da instância Baileys
        webhookUrl: 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/whatsapp_chat_import',
        userId: puppeteerUserId, // ✅ Mesmo usuário da instância Baileys
        action: 'puppeteer_webhook',
        importType: 'history' // ✅ Identificar que é importação de histórico
      };

      console.log(`[Puppeteer Import] 📤 Enviando para VPS (dados da instância existente):`, requestBody);

      const vpsResponse = await fetch(createUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeVPS.token}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log(`[Puppeteer Import] 📥 Resposta VPS - Status: ${vpsResponse.status}`);

      if (!vpsResponse.ok) {
        throw new Error(`VPS returned status ${vpsResponse.status}`);
      }

      const vpsData = await vpsResponse.json();

      console.log(`[Puppeteer Import] ✅ VPS respondeu:`, vpsData);

      if (!vpsData.success) {
        throw new Error(vpsData.message || 'Erro ao criar instância na VPS');
      }

      const sessionId = vpsData.sessionId;
      console.log(`[Puppeteer Import] 🎯 SessionId gerado: ${sessionId}`);

      // Estado 5: Gerando QR Code
      setSession(prev => ({
        ...prev!,
        sessionId,
        instanceId: puppeteerInstanceId, // ✅ Atualizar com o ID correto
        status: 'generating_qr',
        message: 'Gerando QR Code...'
      }));

      await new Promise(resolve => setTimeout(resolve, 2000)); // UX: pausa dramática

      // 🔄 INICIAR POLLING PARA QR CODE
      startQRPolling(sessionId, puppeteerInstanceId, puppeteerUserId, activeVPS);

    } catch (error: any) {
      console.error('[Puppeteer Import] ❌ Erro ao criar sessão:', error);
      setSession({
        sessionId: '',
        instanceId,
        status: 'error',
        error: error.message
      });
      setIsLoading(false);
    }
  };

  // 🔄 Polling para QR Code (REQUISIÇÕES DIRETAS À VPS)
  const startQRPolling = (sessionId: string, instanceId: string, userId: string, activeVPS: typeof VPS_CONFIGS[0]) => {
    const pollQR = async () => {
      try {
        attemptsRef.current++;
        console.log(`[QR Polling] 🔄 Tentativa ${attemptsRef.current}/10 para instância: ${instanceId}`);

        // Verificar timeout ANTES da requisição
        if (attemptsRef.current > 10) {
          throw new Error('Timeout: QR Code não foi gerado em 50 segundos (10 tentativas)');
        }

        // 🌐 REQUISIÇÃO DIRETA À VPS para obter QR Code (ENDPOINT CORRETO)
        const qrUrl = `${activeVPS.url}/instance/${instanceId}/qr`;

        console.log(`[QR Polling] 🌐 Consultando QR na VPS: ${qrUrl}`);

        const vpsResponse = await fetch(qrUrl, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeVPS.token}`
          }
        });

        console.log(`[QR Polling] 📥 Resposta VPS - Status: ${vpsResponse.status}`);

        if (!vpsResponse.ok) {
          throw new Error(`VPS returned status ${vpsResponse.status}`);
        }

        const vpsData = await vpsResponse.json();
        console.log(`[QR Polling] 📊 Dados da VPS:`, {
          success: vpsData.success,
          hasQrCode: vpsData.hasQrCode,
          qrCodeLength: vpsData.qrCode?.length || 0,
          status: vpsData.status
        });

        if (vpsData.success && vpsData.hasQrCode && vpsData.qrCode) {
          console.log(`[QR Polling] 🎉 QR Code encontrado! Parando polling...`);
          
          // Parar polling de QR
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          // ✅ CORREÇÃO 2: UPSERT na tabela instances_puppeteer
          await upsertInstancePuppeteer({
            instance_id: instanceId,
            user_id: userId,
            session_id: sessionId,
            qr_code: vpsData.qrCode,
            status: 'waiting_qr'
          });

          // Atualizar estado local
          setSession(prev => ({
            ...prev!,
            status: 'qr_ready',
            qrCode: vpsData.qrCode,
            message: 'Escaneie o QR Code com seu celular'
          }));

          // Iniciar polling de conexão
          startConnectionPolling(sessionId, instanceId, userId, activeVPS);
          return;
        }

        // QR Code ainda não está pronto, continuar polling
        console.log(`[QR Polling] ⏳ QR Code ainda não está pronto (tentativa ${attemptsRef.current}/10)`);

      } catch (error: any) {
        console.error('[QR Polling] ❌ Erro:', error);
        setSession(prev => ({
          ...prev!,
          status: 'error',
          error: error.message
        }));
        setIsLoading(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };

    // Primeira verificação imediata
    pollQR();
    
    // Polling a cada 5 segundos (conforme solicitado)
    intervalRef.current = setInterval(pollQR, 5000);
  };

  // 🔗 Polling para conexão WhatsApp (DIRETO NA VPS)
  const startConnectionPolling = (sessionId: string, instanceId: string, userId: string, activeVPS: typeof VPS_CONFIGS[0]) => {
    const pollConnection = async () => {
      try {
        const statusUrl = `${activeVPS.url}/instance/${instanceId}/status`;

        const vpsResponse = await fetch(statusUrl, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeVPS.token}`
          }
        });

        if (!vpsResponse.ok) return;

        const vpsData = await vpsResponse.json();
        console.log(`[Connection Polling] 📱 Status:`, vpsData.status);

        // WhatsApp conectou!
        if (vpsData.status === 'connected') {
          console.log(`[Connection Polling] 🎉 WhatsApp conectado!`);
          
          // ✅ CORREÇÃO 2: Atualizar status na tabela instances_puppeteer
          await upsertInstancePuppeteer({
            instance_id: instanceId,
            user_id: userId,
            session_id: sessionId,
            status: 'connected'
          });

          setSession(prev => ({
            ...prev!,
            status: 'connected',
            message: 'WhatsApp conectado! Iniciando importação...'
          }));

          // Parar polling de conexão
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          // Aguardar 2 segundos e iniciar importação
          setTimeout(async () => {
            await startHistoryImport(sessionId, instanceId, userId, activeVPS);
            
            // ✅ CORREÇÃO 1: Auto-fechar modal após iniciar importação
            setTimeout(() => {
              console.log('[Auto Close] 🔒 Fechando modal automaticamente após iniciar importação');
              closeSession();
            }, 3000); // 3 segundos para usuário ver mensagem de início
          }, 2000);
        }

      } catch (error: any) {
        console.error('[Connection Polling] ❌ Erro:', error);
      }
    };

    // Polling a cada 3 segundos para conexão
    intervalRef.current = setInterval(pollConnection, 3000);
  };

  // ✅ CORREÇÃO 2: Função para UPSERT na tabela instances_puppeteer
  const upsertInstancePuppeteer = async (data: {
    instance_id: string;
    user_id: string;
    session_id: string;
    qr_code?: string;
    status: string;
    progress?: number;
    total_contacts?: number;
    total_messages?: number;
    error_message?: string;
    completed_at?: string;
  }) => {
    try {
      console.log('[Database] 💾 Fazendo UPSERT na instances_puppeteer:', {
        instance_id: data.instance_id,
        session_id: data.session_id,
        status: data.status
      });

      const { error } = await supabase
        .from('instances_puppeteer')
        .upsert({
          instance_id: data.instance_id,
          user_id: data.user_id,
          session_id: data.session_id,
          qr_code: data.qr_code,
          status: data.status,
          progress: data.progress || 0,
          total_contacts: data.total_contacts || 0,
          total_messages: data.total_messages || 0,
          error_message: data.error_message,
          completed_at: data.completed_at,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'session_id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('[Database] ❌ Erro no UPSERT instances_puppeteer:', error);
      } else {
        console.log('[Database] ✅ UPSERT instances_puppeteer realizado com sucesso');
      }
    } catch (error) {
      console.error('[Database] ❌ Exceção no UPSERT instances_puppeteer:', error);
    }
  };

  // ✅ CORREÇÃO 3: Importação REAL de histórico (DIRETO NA VPS)
  const startHistoryImport = async (sessionId: string, instanceId: string, userId: string, activeVPS: typeof VPS_CONFIGS[0]) => {
    try {
      setSession(prev => ({
        ...prev!,
        status: 'importing',
        progress: 0,
        message: 'Importando histórico... Você pode fechar este modal.'
      }));

      // Atualizar status na tabela
      await upsertInstancePuppeteer({
        instance_id: instanceId,
        user_id: userId,
        session_id: sessionId,
        status: 'importing',
        progress: 0
      });

      console.log(`[History Import] 🚀 Iniciando importação REAL na VPS para instância: ${instanceId}`);

      // ✅ CORREÇÃO 3: Chamada REAL para VPS
      const importResponse = await fetch(`${activeVPS.url}/start-import`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeVPS.token}`
        },
        body: JSON.stringify({
          sessionId,
          instanceId,
          webhookUrl: 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/whatsapp_chat_import'
        })
      });

      if (!importResponse.ok) {
        throw new Error(`VPS import failed with status ${importResponse.status}`);
      }

      const importData = await importResponse.json();
      console.log(`[History Import] ✅ Importação iniciada na VPS:`, importData);

      // Monitorar progresso via polling
      monitorImportProgress(sessionId, instanceId, userId, activeVPS);

    } catch (error: any) {
      console.error('[History Import] ❌ Erro ao iniciar importação:', error);
      
      // Atualizar com erro
      await upsertInstancePuppeteer({
        instance_id: instanceId,
        user_id: userId,
        session_id: sessionId,
        status: 'error',
        error_message: error.message
      });

      setSession(prev => ({
        ...prev!,
        status: 'error',
        error: error.message
      }));
    }
  };

  // ✅ CORREÇÃO 3: Monitorar progresso da importação
  const monitorImportProgress = (sessionId: string, instanceId: string, userId: string, activeVPS: typeof VPS_CONFIGS[0]) => {
    const pollProgress = async () => {
      try {
        const progressUrl = `${activeVPS.url}/session-status/${sessionId}`;
        
        const response = await fetch(progressUrl, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeVPS.token}`
          }
        });

        if (!response.ok) return;

        const progressData = await response.json();
        console.log(`[Import Progress] 📊 Progresso:`, progressData);

        // Atualizar estado local e banco
        setSession(prev => ({
          ...prev!,
          progress: progressData.progress || 0,
          message: progressData.message || 'Importando...',
          contactsImported: progressData.contactsProcessed,
          messagesImported: progressData.messagesProcessed
        }));

        await upsertInstancePuppeteer({
          instance_id: instanceId,
          user_id: userId,
          session_id: sessionId,
          status: progressData.status,
          progress: progressData.progress || 0,
          total_contacts: progressData.contactsProcessed || 0,
          total_messages: progressData.messagesProcessed || 0
        });

        // Importação concluída
        if (progressData.status === 'completed') {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          setSession(prev => ({
            ...prev!,
            status: 'completed',
            progress: 100,
            message: 'Histórico importado com sucesso!'
          }));

          await upsertInstancePuppeteer({
            instance_id: instanceId,
            user_id: userId,
            session_id: sessionId,
            status: 'completed',
            progress: 100,
            completed_at: new Date().toISOString()
          });

          toast({
            title: "🎉 Importação Concluída",
            description: `${progressData.messagesProcessed || 0} mensagens importadas!`,
          });
        }

      } catch (error: any) {
        console.error('[Import Progress] ❌ Erro:', error);
      }
    };

    // Polling a cada 5 segundos para progresso
    intervalRef.current = setInterval(pollProgress, 5000);
  };

  const restartPolling = () => {
    if (!session) return;
    
    attemptsRef.current = 0;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    console.log('[Puppeteer Import] 🔄 Reiniciando polling...');
    
    supabase.auth.getUser().then(result => {
      if (result.data.user && session.sessionId) {
        // Precisaríamos passar activeVPS aqui também, por agora vamos detectar novamente
        detectActiveVPS().then(activeVPS => {
          if (activeVPS) {
            startQRPolling(session.sessionId, session.instanceId, result.data.user!.id, activeVPS);
          }
        });
      }
    });
  };

  const closeSession = () => {
    console.log('[Puppeteer Import] 🔒 Fechando sessão...');
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setSession(null);
    setIsLoading(false);
    attemptsRef.current = 0;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    session,
    isLoading,
    createSession,
    restartPolling,
    closeSession
  };
} 