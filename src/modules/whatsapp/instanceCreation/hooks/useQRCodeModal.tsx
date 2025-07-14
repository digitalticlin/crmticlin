import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useConnectionStatusSync } from '@/modules/whatsapp/connectionStatusSync';

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
  generateQRCode: () => void;
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
    console.log('[QRCodeModalProvider] 🏗️ Componente montado - NÍVEL 8 COM CONNECTION STATUS SYNC');
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

  // NOVO: Configurar Connection Status Sync para fechar modal automaticamente
  useConnectionStatusSync({
    onConnectionDetected: (data) => {
      // Verificar se é a instância que estamos monitorando
      if (data.instanceId === instanceId && isOpen) {
        console.log('[QRCodeModalProvider] 🎉 Conexão detectada para instância atual!', data);
        
        // Mostrar toast de sucesso
        toast.success(`WhatsApp conectado com sucesso! 📱 ${data.phone || 'Número carregando...'}`);
        
        // Fechar modal automaticamente
        console.log('[QRCodeModalProvider] 🚪 Fechando modal automaticamente após conexão');
        closeModal();
      }
    }
  });

  // NOVO: Função para gerar QR Code manualmente
  const generateQRCode = useCallback(async (id: string) => {
    console.log('[useQRCodeModal] 🔄 Gerando QR Code manualmente para:', id);
    setIsLoading(true);
    setError(undefined);
    
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_qr_manager', {
        body: { instanceId: id }
      });

      if (error) {
        console.error('[useQRCodeModal] ❌ Erro ao gerar QR:', error);
        setError('Erro ao gerar QR Code. Tente novamente.');
        setIsLoading(false);
        return;
      }

      if (data?.success && data?.qrCode) {
        console.log('[useQRCodeModal] ✅ QR Code gerado com sucesso!');
        setQrCode(data.qrCode);
        setIsLoading(false);
        toast.success('QR Code gerado! Escaneie com seu WhatsApp.');
      } else {
        console.log('[useQRCodeModal] ⚠️ QR Code ainda não disponível');
        setError('QR Code ainda não está disponível. Aguarde alguns segundos.');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('[useQRCodeModal] ❌ Erro inesperado:', err);
      setError(`Erro: ${err.message}`);
      setIsLoading(false);
    }
  }, []);

  // CORREÇÃO: Verificação inicial de dados
  const checkInitialData = useCallback(async (id: string) => {
    console.log('[useQRCodeModal] 🔍 Verificando dados iniciais para:', id);
    
      try {
        const { data, error } = await supabase
          .from('whatsapp_instances')
          .select('qr_code, connection_status, instance_name')
          .eq('id', id)
          .single();

        if (error || !data) {
        console.error('[useQRCodeModal] ❌ Erro ao verificar dados iniciais:', error);
        setError('Instância não encontrada.');
        setIsLoading(false);
          return;
        }

      console.log('[useQRCodeModal] 📊 Dados iniciais:', {
          connection_status: data.connection_status,
          instance_name: data.instance_name,
        has_qr_code: !!data.qr_code
        });

      setInstanceName(data.instance_name);

      // Se já está conectado
        if (data.connection_status === 'connected') {
        console.log('[useQRCodeModal] 🎉 Instância já conectada!');
          setQrCode(null);
          setIsLoading(false);
        setError('WhatsApp já está conectado!');
          return;
        }

      // Se já tem QR code
        if (data.qr_code && isValidQRCode(data.qr_code)) {
        console.log('[useQRCodeModal] ✅ QR code já disponível!');
          setQrCode(data.qr_code);
          setIsLoading(false);
          return;
        }

      // Se não tem QR code, aguardar ou permitir geração manual
      console.log('[useQRCodeModal] ⏳ QR code não disponível, aguardando...');
          setIsLoading(false);
      setError('QR Code será carregado automaticamente ou clique em "Gerar QR Code"');

      } catch (err: any) {
      console.error('[useQRCodeModal] ❌ Erro inesperado na verificação inicial:', err);
      setError(`Erro: ${err.message}`);
          setIsLoading(false);
    }
  }, []);

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
    checkInitialData(id);
    
  }, [cleanup, setupRealtime, checkInitialData]);

  // CORREÇÃO: Função para forçar atualização
  const refreshQRCode = useCallback(async () => {
    if (instanceId) {
      console.log('[useQRCodeModal] 🔄 Refresh INTELIGENTE para ID:', instanceId);
      setIsLoading(true);
      setError(undefined);
      setQrCode(null);
      pollingAttemptRef.current = 0;
      
      try {
        // USAR EDGE FUNCTIONS para gerar novo QR
        console.log('[useQRCodeModal] 📡 Tentando whatsapp_qr_manager...');
        
        const { data: qrData, error: qrError } = await supabase.functions.invoke('whatsapp_qr_manager', {
          body: { 
            instanceId,
            instanceName: instanceName || 'instância',
            action: 'generate_qr'
          }
        });

        console.log('[useQRCodeModal] 📊 Resultado whatsapp_qr_manager:', { qrData, qrError });

        // Se conseguiu gerar QR para instância existente
        if (!qrError && qrData?.success && qrData?.qrCode) {
          console.log('[useQRCodeModal] ✅ QR gerado para instância existente');
          
          // Atualizar QR no Supabase
          const { error: updateError } = await supabase
            .from('whatsapp_instances')
            .update({ 
              qr_code: qrData.qrCode,
              connection_status: 'qr_generated',
              updated_at: new Date().toISOString()
            })
            .eq('id', instanceId);

          if (updateError) {
            console.error('[useQRCodeModal] ⚠️ Erro ao atualizar QR no banco:', updateError);
          } else {
            console.log('[useQRCodeModal] ✅ QR atualizado no Supabase');
          }
          
          // Mostrar QR novo
          setQrCode(qrData.qrCode);
          setIsLoading(false);
          toast.success('QR Code atualizado com sucesso!');
          return;
        }

        // FALLBACK: Criar nova instância
        console.log('[useQRCodeModal] ⚠️ Instância não existe, criando nova...');
        
        const { data: createData, error: createError } = await supabase.functions.invoke('whatsapp_instance_manager', {
          body: { 
            action: 'create_instance',
            instanceData: {
              instanceName: instanceName || 'instância',
              instanceId
            }
          }
        });

        if (!createError && createData?.success && createData?.qrCode) {
          console.log('[useQRCodeModal] ✅ Nova instância criada com QR');
          
          // Atualizar no banco
          await supabase
            .from('whatsapp_instances')
            .update({ 
              qr_code: createData.qrCode,
              connection_status: 'qr_generated',
              updated_at: new Date().toISOString()
            })
            .eq('id', instanceId);
          
          setQrCode(createData.qrCode);
          setIsLoading(false);
          toast.success('Nova instância criada! Escaneie o QR Code.');
          return;
        }

        throw new Error(createData?.error || createError?.message || 'Falha ao gerar QR Code');

      } catch (error: any) {
        console.error('[useQRCodeModal] ❌ Erro no refresh inteligente:', error);
        setError(`Erro ao gerar novo QR Code: ${error.message}`);
        setIsLoading(false);
        toast.error(`Erro ao gerar novo QR Code: ${error.message}`);
        
        // FALLBACK: tentar verificação de dados
        console.log('[useQRCodeModal] ⚠️ Tentando fallback com verificação...');
        setupRealtime(instanceId);
        checkInitialData(instanceId);
      }
    } else {
      console.error('[useQRCodeModal] ⚠️ Tentativa de refresh sem instanceId');
    }
  }, [instanceId, instanceName, setupRealtime, checkInitialData]);

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

  // Wrapper para generateQRCode
  const handleGenerateQRCode = useCallback(() => {
    if (instanceId) {
      generateQRCode(instanceId);
    }
  }, [instanceId, generateQRCode]);

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
    refreshQRCode,
    generateQRCode: handleGenerateQRCode
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
