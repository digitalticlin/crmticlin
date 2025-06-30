import { useState, useCallback } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';

const VPS_PRIMARY = 'http://31.97.163.57:3001';
const VPS_FALLBACK = 'http://31.97.24.222:3002';
const AUTH_TOKEN = '8bb0c4f8a89d254783d693050ecd7ff4878534f46a87ece12b24f506548ce430';

interface PuppeteerSession {
  sessionId: string;
  instanceId: string;
  instanceName: string;
  status: string;
  message: string;
  qrCode?: string;
  hasValidQr?: boolean;
}

// Função para gerar instanceId único baseado no email do admin
const generateUniqueInstanceId = async (adminEmail: string, vpsUrl: string): Promise<string> => {
  // Extrair nome base do email (parte antes do @)
  const baseInstanceId = adminEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Função para verificar se instanceId já existe
  const checkInstanceExists = async (instanceId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${vpsUrl}/sessions`, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) return false;
      
      const data = await response.json();
      return data.sessions?.some((session: any) => session.instanceId === instanceId) || false;
    } catch (error) {
      console.warn('Erro ao verificar instância existente:', error);
      return false;
    }
  };

  // Tentar instanceId base primeiro
  let instanceId = baseInstanceId;
  let counter = 1;
  
  // Se já existe, adicionar sufixo numérico
  while (await checkInstanceExists(instanceId)) {
    instanceId = `${baseInstanceId}${counter}`;
    counter++;
    
    // Limite de segurança para evitar loop infinito
    if (counter > 100) {
      instanceId = `${baseInstanceId}_${Date.now()}`;
      break;
    }
  }
  
  return instanceId;
};

export const usePuppeteerQRPolling = () => {
  const { user } = useAuthContext();
  const [isPolling, setIsPolling] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('idle');
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [detectedVPS, setDetectedVPS] = useState<string | null>(null);

  // Detectar VPS disponível
  const detectVPS = useCallback(async (): Promise<string> => {
    const testVPS = async (url: string): Promise<boolean> => {
      try {
        const response = await fetch(`${url}/health`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` },
          signal: AbortSignal.timeout(5000)
        });
        return response.ok;
      } catch (error) {
        console.warn(`VPS ${url} não disponível:`, error);
        return false;
      }
    };

    if (await testVPS(VPS_PRIMARY)) {
      setDetectedVPS(VPS_PRIMARY);
      return VPS_PRIMARY;
    }
    
    if (await testVPS(VPS_FALLBACK)) {
      setDetectedVPS(VPS_FALLBACK);
      return VPS_FALLBACK;
    }
    
    throw new Error('Nenhuma VPS disponível');
  }, []);

  // Criar sessão Puppeteer
  const createSession = useCallback(async (): Promise<PuppeteerSession> => {
    if (!user?.email) {
      throw new Error('Email do usuário não encontrado');
    }

    const vpsUrl = await detectVPS();
    console.log(`🎯 Usando VPS: ${vpsUrl}`);

    // Gerar instanceId único
    const instanceId = await generateUniqueInstanceId(user.email, vpsUrl);
    const instanceName = `Importação ${instanceId}`;
    
    console.log(`🆔 InstanceId gerado: ${instanceId}`);

    const response = await fetch(`${vpsUrl}/create-instance`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instanceId,
        instanceName,
        webhookUrl: 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/whatsapp_chat_import'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro ao criar sessão:', errorText);
      throw new Error(`Erro ao criar sessão: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Sessão criada:', data);
    
    return {
      sessionId: data.sessionId,
      instanceId: data.instanceId,
      instanceName: data.instanceName || instanceName,
      status: data.status || 'created',
      message: data.message || 'Sessão criada com sucesso',
      qrCode: data.qrCode,
      hasValidQr: data.hasValidQr
    };
  }, [user?.email, detectVPS]);

  // ... existing code ...
} 