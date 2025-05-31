
import { useState } from 'react';
import { useWhatsAppWebInstances } from './useWhatsAppWebInstances';
import { useInstanceCreationWithRetry } from './useInstanceCreationWithRetry';
import { useCompanyData } from '../useCompanyData';
import { toast } from 'sonner';

export const useSimpleWhatsAppConnection = () => {
  const [showQRModal, setShowQRModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [currentQRCode, setCurrentQRCode] = useState<string | null>(null);

  const { companyId, loading: companyLoading } = useCompanyData();
  const {
    instances,
    loading: instancesLoading,
    deleteInstance,
    refetch,
    error
  } = useWhatsAppWebInstances(companyId, companyLoading);

  const {
    createInstanceWithRetry,
    cancelCreation,
    isCreating,
    currentStep,
    retryCount,
    maxRetries
  } = useInstanceCreationWithRetry(companyId);

  const quickConnect = async () => {
    if (!companyId) {
      toast.error('Configure sua empresa primeiro');
      return;
    }

    // Gerar nome automático baseado no timestamp
    const instanceName = `whatsapp_${Date.now()}`;
    
    console.log('Starting quick connect for instance:', instanceName);
    
    // Mostrar modal de loading
    setShowLoadingModal(true);
    
    try {
      const result = await createInstanceWithRetry(instanceName);
      
      // Fechar modal de loading
      setShowLoadingModal(false);
      
      if (result.success && result.qrCode) {
        console.log('Instance created successfully with QR code');
        setCurrentQRCode(result.qrCode);
        setShowQRModal(true);
        toast.success('QR Code gerado! Escaneie para conectar.');
        
        // Atualizar lista de instâncias
        await refetch();
      } else {
        console.error('Failed to create instance:', result.error);
        toast.error(result.error || 'Erro ao criar instância WhatsApp');
      }
      
    } catch (err) {
      setShowLoadingModal(false);
      console.error('Erro inesperado ao conectar WhatsApp:', err);
      toast.error('Erro inesperado ao criar instância WhatsApp');
    }
  };

  const handleCancelCreation = () => {
    cancelCreation();
    setShowLoadingModal(false);
    toast.info('Conexão cancelada');
  };

  const closeQRModal = () => {
    setShowQRModal(false);
    setCurrentQRCode(null);
  };

  // Verificar se há instâncias conectadas
  const connectedInstances = instances.filter(i => 
    i.web_status === 'ready' || i.web_status === 'open'
  );

  const hasConnectedInstances = connectedInstances.length > 0;
  const isLoading = companyLoading || instancesLoading;

  return {
    quickConnect,
    showQRModal,
    showLoadingModal,
    currentQRCode,
    closeQRModal,
    handleCancelCreation,
    isConnecting: isCreating,
    currentStep,
    retryCount,
    maxRetries,
    hasConnectedInstances,
    connectedInstances,
    instances,
    isLoading,
    error,
    companyId,
    deleteInstance
  };
};
