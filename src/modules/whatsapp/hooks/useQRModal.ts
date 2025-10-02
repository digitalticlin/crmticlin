import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { qrModalManager } from '../core/QRModalManager';

interface UseQRModalOptions {
  instanceId?: string;
  instanceName?: string;
  onConnectionDetected?: (data: any) => void;
}

interface QRModalState {
  isOpen: boolean;
  qrCode: string | null;
  instanceId: string | null;
  instanceName: string | null;
  isLoading: boolean;
  error?: string;
}

interface QRModalActions {
  openModal: (instanceId: string, instanceName?: string) => boolean;
  closeModal: () => void;
  refreshQRCode: () => void;
  generateQRCode: () => void;
}

/**
 * Hook direto para gerenciar modal QR Code - substitui o Provider
 * Mantém a mesma interface mas com performance otimizada
 */
export const useQRModal = (options: UseQRModalOptions = {}): QRModalState & QRModalActions => {
  // Estados locais (não mais globais via Context)
  const [isOpen, setIsOpen] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [currentInstanceId, setCurrentInstanceId] = useState<string | null>(options.instanceId || null);
  const [instanceName, setInstanceName] = useState<string | null>(options.instanceName || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  
  // Refs para cleanup
  const realtimeSubscriptionRef = useRef<any>(null);

  // Função de limpeza otimizada
  const cleanup = useCallback(() => {
    if (realtimeSubscriptionRef.current) {
      console.log('[useQRModal] 🧹 Limpando subscription');
      realtimeSubscriptionRef.current.unsubscribe();
      realtimeSubscriptionRef.current = null;
    }
  }, []);

  // Validação de QR Code
  const isValidQRCode = (qrCode: string | null): boolean => {
    if (!qrCode || typeof qrCode !== 'string') {
      return false;
    }
    return qrCode.includes('base64') || qrCode.includes('data:image') || qrCode.length > 50;
  };

  // Connection Status Sync está implementado no realtime subscription abaixo

  // Verificação inicial de dados
  const checkInitialData = useCallback(async (instanceId: string) => {
    console.log('[useQRModal] 🔍 Verificando dados iniciais para:', instanceId);
    
    try {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('qr_code, connection_status, instance_name, web_status')
        .eq('id', instanceId)
        .single();

      if (error || !data) {
        console.error('[useQRModal] ❌ Erro ao verificar dados iniciais:', error);
        setError('Instância não encontrada.');
        setIsLoading(false);
        return;
      }

      console.log('[useQRModal] 📊 Dados iniciais:', {
        connection_status: data.connection_status,
        web_status: data.web_status,
        instance_name: data.instance_name,
        has_qr_code: !!data.qr_code
      });

      setInstanceName(data.instance_name);

      // Se já está conectado - fechar modal
      if (data.connection_status === 'connected' || data.connection_status === 'ready') {
        console.log('[useQRModal] 🎉 Instância já conectada! Fechando modal...');
        toast.success('WhatsApp já está conectado!');
        closeModal();
        return;
      }

      // Se já tem QR code válido - mostrar imediatamente
      if (data.qr_code && isValidQRCode(data.qr_code)) {
        console.log('[useQRModal] ✅ QR code já disponível!');
        setQrCode(data.qr_code);
        setIsLoading(false);
        setError(undefined);
        return;
      }

      // Estado padrão: aguardar webhook
      console.log('[useQRModal] ⏳ Aguardando QR code via webhook...');
      setIsLoading(true);
      setError(undefined);

    } catch (err: any) {
      console.error('[useQRModal] ❌ Erro inesperado na verificação inicial:', err);
      setError(`Erro: ${err.message}`);
      setIsLoading(false);
    }
  }, []);

  // Setup realtime subscription - só quando modal aberto
  const setupRealtime = useCallback((instanceId: string) => {
    console.log('[useQRModal] 📡 Configurando realtime para:', instanceId);
    
    // Limpar subscription anterior
    cleanup();

    try {
      const subscription = supabase
        .channel(`qr-modal-${instanceId}-${Date.now()}`) // Canal único por sessão
        .on(
          'postgres_changes',
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'whatsapp_instances',
            filter: `id=eq.${instanceId}`
          },
          (payload) => {
            console.log('[useQRModal] 📱 Atualização realtime:', payload);
            
            const newData = payload.new;
            
            // Verificar conexão
            const connectedStatuses = ['connected', 'ready', 'open'];
            if (connectedStatuses.includes(newData.connection_status?.toLowerCase())) {
              console.log('[useQRModal] 🎉 Conectado via realtime!', {
                status: newData.connection_status,
                phone: newData.phone,
                profileName: newData.profile_name
              });
              
              const phoneInfo = newData.phone ? ` 📱 ${newData.phone}` : '';
              const profileInfo = newData.profile_name ? ` (${newData.profile_name})` : '';
              
              toast.success(`WhatsApp conectado com sucesso!${phoneInfo}${profileInfo}`);
              
              // Chamar callback de conexão detectada
              if (options.onConnectionDetected) {
                options.onConnectionDetected({
                  instanceId: instanceId,
                  phone: newData.phone,
                  profileName: newData.profile_name,
                  status: newData.connection_status
                });
              }
              
              closeModal();
              return;
            }
            
            // Verificar QR code
            if (newData.qr_code && isValidQRCode(newData.qr_code)) {
              console.log('[useQRModal] 🔄 QR code recebido via realtime');
              setQrCode(newData.qr_code);
              setInstanceName(newData.instance_name);
              setIsLoading(false);
              setError(undefined);
              toast.success('QR code atualizado!');
            }
          }
        )
        .subscribe();

      realtimeSubscriptionRef.current = subscription;
    } catch (err) {
      console.error('[useQRModal] ❌ Erro ao configurar realtime:', err);
    }
  }, [cleanup]);

  // Função para abrir modal (apenas para IDs reais)
  const openModal = useCallback((instanceId: string, providedInstanceName?: string) => {
    console.log('[useQRModal] 🚀 Abrindo modal QR para instância:', instanceId, 'nome:', providedInstanceName);
    
    if (!instanceId || instanceId.startsWith('temp_')) {
      console.error('[useQRModal] ❌ ID de instância inválido ou temporário:', instanceId);
      toast.error('ID de instância inválido');
      return false;
    }
    
    // Usar nome fornecido se disponível
    if (providedInstanceName) {
      setInstanceName(providedInstanceName);
    }
    
    // Verificar com singleton manager
    if (!qrModalManager.openModal(instanceId, providedInstanceName || instanceName || undefined)) {
      return false; // Toast já foi mostrado pelo manager
    }
    
    // Limpar estado anterior
    cleanup();
    setQrCode(null);
    setError(undefined);
    setIsLoading(true);
    
    // Configurar nova instância
    setCurrentInstanceId(instanceId);
    setIsOpen(true);
    
    // Configurar sistemas
    setupRealtime(instanceId);
    checkInitialData(instanceId);
    
    return true;
  }, [instanceName, cleanup, setupRealtime, checkInitialData]);

  // Refresh QR Code usando whatsapp_qr_manager
  const refreshQRCode = useCallback(async () => {
    if (currentInstanceId) {
      console.log('[useQRModal] 🔄 Solicitando QR para instância existente:', currentInstanceId);
      setIsLoading(true);
      setError(undefined);
      setQrCode(null);

      try {
        // PASSO 1: Limpar QR code antigo da tabela antes de solicitar novo
        console.log('[useQRModal] 🧹 Limpando QR code antigo da tabela...');
        const { error: clearError } = await supabase
          .from('whatsapp_instances')
          .update({ qr_code: null })
          .eq('id', currentInstanceId);

        if (clearError) {
          console.error('[useQRModal] ❌ Erro ao limpar QR code antigo:', clearError);
          setError('Erro ao limpar QR code antigo');
          setIsLoading(false);
          toast.error('Erro ao limpar QR Code');
          return;
        }

        console.log('[useQRModal] ✅ QR code antigo limpo com sucesso');

        // PASSO 2: Solicitar novo QR code via edge function
        const { data, error } = await supabase.functions.invoke('whatsapp_qr_manager', {
          body: { instanceId: currentInstanceId }
        });

        if (error) {
          console.error('[useQRModal] ❌ Erro na edge function:', error);
          setError(`Erro ao solicitar QR Code: ${error.message}`);
          setIsLoading(false);
          toast.error('Erro ao gerar QR Code');
          return;
        }

        if (data?.success) {
          if (data.connected) {
            console.log('[useQRModal] 🎉 Instância já conectada!');
            toast.success('WhatsApp já está conectado!');
            closeModal();
            return;
          }
          
          if (data.qrCode) {
            console.log('[useQRModal] ✅ QR Code recebido via whatsapp_qr_manager');
            setQrCode(data.qrCode);
            setIsLoading(false);
            toast.success('QR Code gerado com sucesso!');
            return;
          }
        }

        if (data?.waiting) {
          console.log('[useQRModal] ⏳ QR ainda não disponível, aguardando webhook...');
          setIsLoading(false);
          setError('QR Code será enviado automaticamente. Aguarde...');
          toast.info('QR Code será gerado automaticamente');
        } else {
          setError(data?.message || 'Erro desconhecido ao gerar QR Code');
          setIsLoading(false);
          toast.error('Falha ao gerar QR Code');
        }

      } catch (err: any) {
        console.error('[useQRModal] ❌ Erro inesperado:', err);
        setError(`Erro: ${err.message}`);
        setIsLoading(false);
        toast.error('Erro de conexão');
      }
    } else {
      console.error('[useQRModal] ⚠️ Tentativa de refresh sem instanceId');
      toast.error('ID da instância não encontrado');
    }
  }, [currentInstanceId]);

  // Função para fechar modal
  const closeModal = useCallback(() => {
    console.log('[useQRModal] 🚪 Fechando modal');
    
    cleanup();
    
    // Notificar singleton manager
    qrModalManager.closeModal(currentInstanceId || undefined);
    
    // Resetar estado local
    setIsOpen(false);
    setQrCode(null);
    setCurrentInstanceId(null);
    setInstanceName(null);
    setIsLoading(false);
    setError(undefined);
  }, [cleanup, currentInstanceId]);

  // Generate QR Code (alias para refresh)
  const generateQRCode = useCallback(() => {
    console.log('[useQRModal] 🔄 Generate QR Code chamado - redirecionando para refresh');
    refreshQRCode();
  }, [refreshQRCode]);

  // Cleanup ao desmontar componente
  useEffect(() => {
    return () => {
      cleanup();
      if (currentInstanceId) {
        qrModalManager.closeModal(currentInstanceId);
      }
    };
  }, [cleanup, currentInstanceId]);

  // Retorna interface idêntica ao Provider anterior
  return {
    // Estados
    isOpen,
    qrCode,
    instanceId: currentInstanceId,
    instanceName,
    isLoading,
    error,
    
    // Ações
    openModal,
    closeModal,
    refreshQRCode,
    generateQRCode
  };
};