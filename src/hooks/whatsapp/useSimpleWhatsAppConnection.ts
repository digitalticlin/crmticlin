
import { useState } from 'react';
import { useWhatsAppWebInstances } from './useWhatsAppWebInstances';
import { useCompanyData } from '../useCompanyData';
import { toast } from 'sonner';

export const useSimpleWhatsAppConnection = () => {
  const [showQRModal, setShowQRModal] = useState(false);
  const [currentQRCode, setCurrentQRCode] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const { companyId, loading: companyLoading } = useCompanyData();
  const {
    instances,
    loading: instancesLoading,
    createInstance,
    error
  } = useWhatsAppWebInstances(companyId, companyLoading);

  const quickConnect = async () => {
    if (!companyId) {
      toast.error('Configure sua empresa primeiro');
      return;
    }

    setIsConnecting(true);
    try {
      // Gerar nome automático baseado no timestamp
      const instanceName = `whatsapp_${Date.now()}`;
      
      await createInstance(instanceName);
      
      // Buscar a instância recém-criada para obter o QR Code
      const newInstance = instances.find(i => i.instance_name === instanceName);
      if (newInstance?.qr_code) {
        setCurrentQRCode(newInstance.qr_code);
        setShowQRModal(true);
      }
      
      toast.success('QR Code gerado! Escaneie para conectar.');
    } catch (err) {
      console.error('Erro ao conectar WhatsApp:', err);
      toast.error('Erro ao gerar QR Code');
    } finally {
      setIsConnecting(false);
    }
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
    currentQRCode,
    closeQRModal,
    isConnecting,
    hasConnectedInstances,
    connectedInstances,
    instances,
    isLoading,
    error,
    companyId
  };
};
