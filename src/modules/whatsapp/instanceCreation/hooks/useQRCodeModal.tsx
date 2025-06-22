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
  refreshQRCode: () => void; // Nova função para forçar atualização
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
  const retryTimerRef = useRef<number | null>(null);
  const realtimeSubscriptionRef = useRef<any>(null);

  // Log quando o Provider é montado
  useEffect(() => {
    console.log('[QRCodeModalProvider] 🏗️ Componente montado');
    return () => {
      console.log('[QRCodeModalProvider] 🗑️ Componente desmontado');
      // Limpar subscription quando componente é desmontado
      if (realtimeSubscriptionRef.current) {
        realtimeSubscriptionRef.current.unsubscribe();
      }
    }
  }, []);

  // CORREÇÃO: Simplificada para aceitar QUALQUER QR code que tenha dados
  const isValidQRCode = (qrCode: string | null): boolean => {
    if (!qrCode) {
      console.log('[useQRCodeModal] ⚠️ QR code nulo');
      return false;
    }
    
    // Log para diagnóstico
    console.log('[useQRCodeModal] 📊 Analisando QR code:', {
      length: qrCode.length,
      startsWith_data: qrCode.startsWith('data:'),
      containsBase64: qrCode.includes('base64,'),
      firstChars: qrCode.substring(0, 30)
    });

    // CORREÇÃO: Aceitar qualquer dado que pareça um QR code base64
    // Esta validação é muito mais permissiva para evitar rejeições incorretas
    if (qrCode.length > 50) { // Pelo menos algum conteúdo substancial
      return true;
    }
    
    console.log('[useQRCodeModal] ⚠️ QR code muito curto ou inválido');
    return false;
  };

  // Configurar realtime subscription para o QR code (quando o instanceId mudar)
  const setupRealtimeSubscription = useCallback((id: string) => {
    console.log('[useQRCodeModal] 📡 Configurando realtime para instância:', id);
    
    // Limpar subscription anterior se existir
    if (realtimeSubscriptionRef.current) {
      realtimeSubscriptionRef.current.unsubscribe();
      realtimeSubscriptionRef.current = null;
    }

    try {
      // Inscreve-se para atualizações em tempo real da instância atual
      const subscription = supabase
        .channel('qrcode-changes')
        .on(
          'postgres_changes',
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'whatsapp_instances',
            filter: `id=eq.${id}`
          },
          (payload) => {
            console.log('[useQRCodeModal] 📱 Recebendo atualização em tempo real:', payload);
            
            // Verificar se o modal ainda está aberto
            if (!isOpen) {
              console.log('[useQRCodeModal] ⚠️ Modal fechado, ignorando atualização em tempo real');
              return;
            }
            
            const newData = payload.new;
            
            // Verificar se é conectado
            if (newData.connection_status === 'connected') {
              console.log('[useQRCodeModal] 🎉 Instância conectada via realtime!');
              toast.success('WhatsApp conectado com sucesso!');
              setQrCode(null);
              setIsLoading(false);
              setError('WhatsApp conectado com sucesso! Você pode fechar esta janela.');
            }
            
            // CORREÇÃO: Sempre tentar processar o QR code recebido
            if (newData.qr_code) {
              console.log('[useQRCodeModal] 🔄 QR code recebido via realtime:', newData.qr_code.substring(0, 30) + '...');
              setQrCode(newData.qr_code);
              setInstanceName(newData.instance_name);
              setIsLoading(false);
              setError(undefined);
            }
          }
        )
        .subscribe((status) => {
          console.log('[useQRCodeModal] 📶 Status da inscrição realtime:', status);
        });

      realtimeSubscriptionRef.current = subscription;
    } catch (err) {
      console.error('[useQRCodeModal] ❌ Erro ao configurar realtime:', err);
    }

  }, [isOpen]);

  // CORREÇÃO: Função atualizada para receber QR code diretamente sem validação excessiva
  // IMPORTANTE: Adicionando todas as dependências corretas para evitar closure bugs
  const fetchQRCodeWithRetry = useCallback(async (id: string, attempt = 1, maxAttempts = 15) => {
    if (!id) {
      console.error('[useQRCodeModal] ❌ ID de instância inválido:', id);
      return;
    }
    
    try {
      console.log('[useQRCodeModal] 🔍 Tentativa', attempt, 'de', maxAttempts, 'para ID:', id);
      
      // Verificar se o modal ainda está aberto
      if (!isOpen) {
        console.log('[useQRCodeModal] ⚠️ Modal foi fechado, cancelando busca do QR code');
        return;
      }

      // CORREÇÃO: Destacar qual ID está sendo consultado
      console.log('[useQRCodeModal] 🔄 Buscando QR code para instância com ID:', id);

      // Buscar dados da instância
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('qr_code, connection_status, instance_name')
        .eq('id', id)
        .single();

      if (error) {
        console.error('[useQRCodeModal] ❌ Erro ao buscar dados:', error);
        
        if (attempt < maxAttempts && isOpen) {
          console.log('[useQRCodeModal] 🔄 Tentando novamente em 800ms');
          retryTimerRef.current = window.setTimeout(() => {
            fetchQRCodeWithRetry(id, attempt + 1, maxAttempts);
          }, 800);
        } else {
          setIsLoading(false);
          setError('Não foi possível obter o QR code após várias tentativas.');
          toast.error('Não foi possível obter o QR code após várias tentativas.');
        }
        return;
      }

      // CORREÇÃO: Imprimir dados completos para diagnóstico
      console.log('[useQRCodeModal] 📊 Dados recebidos:', {
        id: id,
        connection_status: data?.connection_status,
        instance_name: data?.instance_name,
        qr_code_length: data?.qr_code?.length,
        qr_code_preview: data?.qr_code ? `${data.qr_code.substring(0, 50)}...` : 'null'
      });

      if (!data) {
        console.log('[useQRCodeModal] ⚠️ Nenhum dado retornado');
        if (attempt < maxAttempts && isOpen) {
          retryTimerRef.current = window.setTimeout(() => {
            fetchQRCodeWithRetry(id, attempt + 1, maxAttempts);
          }, 800);
        } else {
          setIsLoading(false);
          setError('Instância não encontrada no banco de dados.');
          toast.error('Instância não encontrada no banco de dados.');
        }
        return;
      }

      // Verificar status da conexão
      if (data.connection_status === 'connected') {
        console.log('[useQRCodeModal] ℹ️ Instância já está conectada');
        setIsLoading(false);
        setError('Esta instância já está conectada ao WhatsApp!');
        return;
      }
      
      // DEBUG: Verificação extra
      console.log('[useQRCodeModal] 🔎 QR Code nulo?', data.qr_code === null);
      console.log('[useQRCodeModal] 🔎 QR Code comprimento:', data.qr_code ? data.qr_code.length : 'N/A');

      // CORREÇÃO: Verificar diretamente sem validação excessiva
      if (!data.qr_code) {
        console.log('[useQRCodeModal] ⚠️ QR code não disponível no banco (null)');
        
        if (attempt < maxAttempts && isOpen) {
          console.log('[useQRCodeModal] 🔄 Tentando novamente em 800ms');
          retryTimerRef.current = window.setTimeout(() => {
            fetchQRCodeWithRetry(id, attempt + 1, maxAttempts);
          }, 800);
        } else {
          setIsLoading(false);
          setError('QR code não disponível no banco de dados após várias tentativas.');
          toast.error('QR code não disponível no banco de dados após várias tentativas.');
        }
        return;
      }

      // CORREÇÃO: Aplicar QR code diretamente sem validação adicional
      console.log('[useQRCodeModal] ✅ QR code obtido e será exibido diretamente');
      console.log('[useQRCodeModal] 📏 Tamanho do QR code:', data.qr_code.length, 'caracteres');
      console.log('[useQRCodeModal] 🔍 Início do QR code:', data.qr_code.substring(0, 50), '...');
      
      // Notificar o usuário
      if (attempt === 1) {
        toast.success('QR code carregado com sucesso! Escaneie com seu WhatsApp.');
      }

      // Definir os dados para o componente renderizar
      setQrCode(data.qr_code);
      setInstanceName(data.instance_name);
      setIsLoading(false);
      setError(undefined);
    } catch (err: any) {
      console.error('[useQRCodeModal] ❌ Erro inesperado:', err);
      setIsLoading(false);
      
      if (attempt < maxAttempts && isOpen) {
        retryTimerRef.current = window.setTimeout(() => {
          fetchQRCodeWithRetry(id, attempt + 1, maxAttempts);
        }, 800);
      } else {
        setError(`Erro ao obter QR code: ${err.message || 'Erro desconhecido'}`);
        toast.error(`Erro ao obter QR code: ${err.message || 'Erro desconhecido'}`);
      }
    }
  }, [isOpen]); // CORREÇÃO: As dependências estão corretas, só precisamos de isOpen aqui

  // CORREÇÃO: Criar uma função para garantir que estamos usando o ID correto
  const loadQRCode = useCallback((id: string) => {
    console.log('[useQRCodeModal] ⚙️ loadQRCode chamado com id:', id);
    fetchQRCodeWithRetry(id, 1, 15);
  }, [fetchQRCodeWithRetry]);

  // Função para abrir o modal
  const openModal = useCallback((id: string) => {
    console.log('[useQRCodeModal] 🚀 Abrindo modal para instância:', id);
    
    if (!id) {
      console.error('[useQRCodeModal] ❌ Tentativa de abrir modal com ID vazio');
      toast.error('ID de instância inválido');
      return;
    }
    
    // Limpar estado anterior
    setQrCode(null);
    setError(undefined);
    setIsLoading(true);
    
    // Configurar nova instância
    setInstanceId(id);
    
    // IMPORTANTE: Abrir modal antes de buscar o QR code
    setIsOpen(true);
    
    // Configurar realtime subscription
    setupRealtimeSubscription(id);
    
    // CORREÇÃO: Buscar QR code imediatamente com o ID correto
    // Usando setTimeout para garantir que o state foi atualizado
    setTimeout(() => {
      console.log('[useQRCodeModal] ⏱️ Executando busca após delay');
      loadQRCode(id);
    }, 100);
    
  }, [setupRealtimeSubscription, loadQRCode]);

  // Função para forçar atualização do QR code
  const refreshQRCode = useCallback(() => {
    if (instanceId) {
      console.log('[useQRCodeModal] 🔄 Forçando atualização do QR code para ID:', instanceId);
      setIsLoading(true);
      setError(undefined);
      setQrCode(null);
      // CORREÇÃO: Usar a função correta com o ID atual
      loadQRCode(instanceId);
    } else {
      console.error('[useQRCodeModal] ⚠️ Tentativa de refresh sem instanceId definido');
    }
  }, [instanceId, loadQRCode]);

  // Função para fechar o modal
  const closeModal = useCallback(() => {
    console.log('[useQRCodeModal] 🚪 Fechando modal');
    
    // Limpar timer de retry se existir
    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    
    // Limpar subscription de realtime
    if (realtimeSubscriptionRef.current) {
      console.log('[useQRCodeModal] 📱 Cancelando inscrição realtime');
      realtimeSubscriptionRef.current.unsubscribe();
      realtimeSubscriptionRef.current = null;
    }
    
    // Resetar estado
    setIsOpen(false);
    setQrCode(null);
    setInstanceId(null);
    setInstanceName(null);
    setIsLoading(false);
    setError(undefined);
  }, []);

  // Limpar timeout ao desmontar
  useEffect(() => {
    return () => {
      if (retryTimerRef.current !== null) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }

      // Limpar subscription de realtime
      if (realtimeSubscriptionRef.current) {
        realtimeSubscriptionRef.current.unsubscribe();
        realtimeSubscriptionRef.current = null;
      }
    };
  }, []);

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
