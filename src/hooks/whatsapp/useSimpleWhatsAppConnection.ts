
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
    refreshQRCode,
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
      
      console.log('Creating instance:', instanceName);
      const newInstance = await createInstance(instanceName);
      
      if (newInstance) {
        console.log('Instance created:', newInstance);
        
        // Se a instância foi criada e tem QR Code, mostrar modal
        if (newInstance.qr_code) {
          setCurrentQRCode(newInstance.qr_code);
          setShowQRModal(true);
          toast.success('QR Code gerado! Escaneie para conectar.');
        } else if (newInstance.vps_instance_id) {
          // Se não tem QR Code, tentar buscar
          console.log('Fetching QR Code for instance:', newInstance.vps_instance_id);
          try {
            const qrCode = await refreshQRCode(newInstance.id);
            if (qrCode) {
              setCurrentQRCode(qrCode);
              setShowQRModal(true);
              toast.success('QR Code gerado! Escaneie para conectar.');
            } else {
              toast.error('Erro ao gerar QR Code');
            }
          } catch (qrError) {
            console.error('Error fetching QR Code:', qrError);
            toast.error('Erro ao gerar QR Code');
          }
        } else {
          toast.error('Erro ao criar instância WhatsApp');
        }
      } else {
        toast.error('Erro ao criar instância WhatsApp');
      }
      
    } catch (err) {
      console.error('Erro ao conectar WhatsApp:', err);
      toast.error('Erro ao criar instância WhatsApp');
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
