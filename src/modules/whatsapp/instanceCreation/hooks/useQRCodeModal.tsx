
import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Interface para o contexto
interface QRCodeModalContextProps {
  isOpen: boolean;
  qrCode: string | null;
  instanceId: string | null;
  instanceName: string | null;
  isLoading: boolean;
  error?: string;
  openModal: (instanceId: string) => void;
  closeModal: () => void;
  refreshQRCode: () => void;
}

// Criando o contexto
const QRCodeModalContext = createContext<QRCodeModalContextProps | undefined>(undefined);

// Provider que será exportado e utilizado no nível mais alto da aplicação
export const QRCodeModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  
  const pollingIntervalRef = useRef<number | null>(null);
  const realtimeSubscriptionRef = useRef<any>(null);
  const pollingAttemptRef = useRef(0);

  // Log quando o Provider é montado
  useEffect(() => {
    console.log('[QRCodeModalProvider] 🏗️ Componente montado - NÍVEL 8');
    return () => {
      console.log('[QRCodeModalProvider] 🗑️ Componente desmontado');
      // Limpar todos os recursos
      cleanup();
    }
  }, []);

  // CORREÇÃO NÍVEL 8: Função de limpeza unificada
  const cleanup = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    if (realtimeSubscriptionRef.current) {
      realtimeSubscriptionRef.current.unsubscribe();
      realtimeSubscriptionRef.current = null;
    }
    
    pollingAttemptRef.current = 0;
  }, []);

  // CORREÇÃO: Validação mais simples de QR Code
  const isValidQRCode = (qrCode: string | null): boolean => {
    if (!qrCode || typeof qrCode !== 'string') {
      console.log('[useQRCodeModal] ⚠️ QR code vazio ou inválido');
      return false;
    }
    
    // Aceitar qualquer string que contenha base64 ou data:image
    if (qrCode.includes('base64') || qrCode.includes('data:image') || qrCode.length > 50) {
      console.log('[useQRCodeModal] ✅ QR code válido detectado:', qrCode.substring(0, 50) + '...');
      return true;
    }
    
    console.log('[useQRCodeModal] ⚠️ QR code não parece válido:', qrCode.length, 'caracteres');
    return false;
  };

  // CORREÇÃO: Polling simplificado
  const startPolling = useCallback((id: string) => {
    console.log('[useQRCodeModal] 🔍 Iniciando polling simplificado para:', id);
    
    const poll = async () => {
      try {
        const { data, error } = await supabase
          .from('whatsapp_instances')
          .select('qr_code, connection_status, instance_name')
          .eq('id', id)
          .single();

        if (error || !data) {
          console.error('[useQRCodeModal] ❌ Erro no polling:', error);
          return;
        }

        console.log('[useQRCodeModal] 📊 Dados do polling:', {
          id: id,
          connection_status: data.connection_status,
          instance_name: data.instance_name,
          has_qr_code: !!data.qr_code,
          qr_length: data.qr_code?.length || 0
        });

        // Verificar se foi conectado
        if (data.connection_status === 'connected') {
          console.log('[useQRCodeModal] 🎉 Instância conectada!');
          toast.success('WhatsApp conectado com sucesso!');
          setQrCode(null);
          setIsLoading(false);
          setError('WhatsApp conectado com sucesso! Você pode fechar esta janela.');
          cleanup();
          return;
        }

        // Verificar QR code
        if (data.qr_code && isValidQRCode(data.qr_code)) {
          console.log('[useQRCodeModal] ✅ QR code válido encontrado!');
          setQrCode(data.qr_code);
          setInstanceName(data.instance_name);
          setIsLoading(false);
          setError(undefined);
          toast.success('QR code carregado! Escaneie com seu WhatsApp.');
          cleanup(); // Parar polling quando QR code for obtido
          return;
        }

        // Incrementar tentativas
        pollingAttemptRef.current += 1;
        console.log('[useQRCodeModal] 🔄 Tentativa de polling:', pollingAttemptRef.current);

        // Parar após muitas tentativas
        if (pollingAttemptRef.current >= 15) {
          console.log('[useQRCodeModal] ⏰ Timeout do polling após 15 tentativas');
          setIsLoading(false);
          setError('QR code não disponível. Tente gerar novamente.');
          cleanup();
        }

      } catch (err: any) {
        console.error('[useQRCodeModal] ❌ Erro inesperado no polling:', err);
        pollingAttemptRef.current += 1;
        
        if (pollingAttemptRef.current >= 15) {
          setIsLoading(false);
          setError(`Erro ao obter QR code: ${err.message}`);
          cleanup();
        }
      }
    };

    // Iniciar polling imediato e depois a cada 2 segundos
    poll();
    pollingIntervalRef.current = window.setInterval(poll, 2000);
  }, [cleanup]);

  // CORREÇÃO: Realtime simplificado
  const setupRealtime = useCallback((id: string) => {
    console.log('[useQRCodeModal] 📡 Configurando realtime para:', id);
    
    // Limpar subscription anterior
    if (realtimeSubscriptionRef.current) {
      realtimeSubscriptionRef.current.unsubscribe();
      realtimeSubscriptionRef.current = null;
    }

    try {
      const subscription = supabase
        .channel(`qrcode-${id}`)
        .on(
          'postgres_changes',
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'whatsapp_instances',
            filter: `id=eq.${id}`
          },
          (payload) => {
            console.log('[useQRCodeModal] 📱 Atualização realtime:', payload);
            
            const newData = payload.new;
            
            // Verificar conexão
            if (newData.connection_status === 'connected') {
              console.log('[useQRCodeModal] 🎉 Conectado via realtime!');
              toast.success('WhatsApp conectado com sucesso!');
              setQrCode(null);
              setIsLoading(false);
              setError('WhatsApp conectado com sucesso!');
              cleanup();
              return;
            }
            
            // Verificar QR code
            if (newData.qr_code && isValidQRCode(newData.qr_code)) {
              console.log('[useQRCodeModal] 🔄 QR code recebido via realtime');
              setQrCode(newData.qr_code);
              setInstanceName(newData.instance_name);
              setIsLoading(false);
              setError(undefined);
              toast.success('QR code atualizado!');
              cleanup(); // Parar polling quando QR code chegar
            }
          }
        )
        .subscribe();

      realtimeSubscriptionRef.current = subscription;
    } catch (err) {
      console.error('[useQRCodeModal] ❌ Erro ao configurar realtime:', err);
    }
  }, [cleanup]);

  // CORREÇÃO: Função para abrir o modal
  const openModal = useCallback((id: string) => {
    console.log('[useQRCodeModal] 🚀 Abrindo modal para instância:', id);
    
    if (!id) {
      console.error('[useQRCodeModal] ❌ ID de instância inválido');
      toast.error('ID de instância inválido');
      return;
    }
    
    // Limpar estado anterior
    cleanup();
    setQrCode(null);
    setError(undefined);
    setIsLoading(true);
    pollingAttemptRef.current = 0;
    
    // Configurar nova instância
    setInstanceId(id);
    
    // Abrir modal
    setIsOpen(true);
    
    // Configurar sistemas
    setupRealtime(id);
    startPolling(id);
    
  }, [cleanup, setupRealtime, startPolling]);

  // CORREÇÃO: Função para forçar atualização
  const refreshQRCode = useCallback(() => {
    if (instanceId) {
      console.log('[useQRCodeModal] 🔄 Refresh para ID:', instanceId);
      setIsLoading(true);
      setError(undefined);
      setQrCode(null);
      pollingAttemptRef.current = 0;
      
      // Reiniciar sistemas
      setupRealtime(instanceId);
      startPolling(instanceId);
    } else {
      console.error('[useQRCodeModal] ⚠️ Tentativa de refresh sem instanceId');
    }
  }, [instanceId, setupRealtime, startPolling]);

  // CORREÇÃO: Função para fechar o modal
  const closeModal = useCallback(() => {
    console.log('[useQRCodeModal] 🚪 Fechando modal');
    
    cleanup();
    
    // Resetar estado
    setIsOpen(false);
    setQrCode(null);
    setInstanceId(null);
    setInstanceName(null);
    setIsLoading(false);
    setError(undefined);
  }, [cleanup]);

  // Limpar recursos ao desmontar
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Valor do contexto
  const contextValue: QRCodeModalContextProps = {
    isOpen,
    qrCode,
    instanceId,
    instanceName,
    isLoading,
    error,
    openModal,
    closeModal,
    refreshQRCode
  };

  return (
    <QRCodeModalContext.Provider value={contextValue}>
      {children}
    </QRCodeModalContext.Provider>
  );
};

// Hook para usar o contexto
export const useQRCodeModal = () => {
  const context = useContext(QRCodeModalContext);
  if (context === undefined) {
    throw new Error('useQRCodeModal deve ser usado dentro de QRCodeModalProvider');
  }
  return context;
};
