
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useInstanceActions } from './services/instanceActionsService';
import { useIntelligentNaming } from './useIntelligentNaming';
import { useInstanceQRCode } from './useInstanceQRCode';
import { useInstancesData } from './useInstancesData';

export interface WhatsAppWebInstance {
  id: string;
  instance_name: string;
  phone: string;
  connection_status: string;
  web_status?: string;
  qr_code?: string;
  date_connected?: string;
  date_disconnected?: string;
  vps_instance_id?: string;
  server_url?: string;
  updated_at?: string;
  profile_name?: string;
  profile_pic_url?: string;
}

export const useWhatsAppWebInstances = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQRCode, setSelectedQRCode] = useState<string | null>(null);
  const [selectedInstanceName, setSelectedInstanceName] = useState<string>('');
  
  const { user } = useAuth();

  // Use specialized hooks
  const { instances, isLoading, error, fetchInstances, refetch } = useInstancesData();
  const { generateIntelligentInstanceName } = useIntelligentNaming();
  const { refreshInstanceQRCode } = useInstanceQRCode(instances, fetchInstances);
  const { createInstance, deleteInstance, refreshQRCode } = useInstanceActions(fetchInstances);

  // Close QR Modal
  const closeQRModal = () => {
    setShowQRModal(false);
    setSelectedQRCode(null);
    setSelectedInstanceName('');
  };

  // CORREÇÃO FASE 3.1: Buscar QR Code atualizado automaticamente para instâncias em waiting_scan
  useEffect(() => {
    if (!instances.length) return;

    const checkForQRUpdates = () => {
      instances.forEach(async (instance) => {
        if (instance.web_status === 'waiting_scan' && instance.vps_instance_id) {
          // Verificar se QR code precisa ser atualizado (opcional - apenas se necessário)
          const lastUpdate = instance.updated_at ? new Date(instance.updated_at) : new Date(0);
          const now = new Date();
          const timeDiff = now.getTime() - lastUpdate.getTime();
          
          // Atualizar QR Code se a última atualização foi há mais de 30 segundos
          if (timeDiff > 30000) {
            console.log('[WhatsApp Web Instances] 🔄 Auto-refresh QR Code para:', instance.instance_name);
            await refreshInstanceQRCode(instance.id);
          }
        }
      });
    };

    // Verificar atualizações a cada 30 segundos
    const interval = setInterval(checkForQRUpdates, 30000);

    return () => clearInterval(interval);
  }, [instances, refreshInstanceQRCode]);

  return {
    instances,
    isLoading,
    isConnecting,
    error,
    showQRModal,
    selectedQRCode,
    selectedInstanceName,
    refetch,
    fetchInstances,
    // FASE 3.1.3: Exportar função de nomenclatura inteligente
    generateIntelligentInstanceName,
    // CORREÇÃO FASE 3.1.2: createInstance modificado para retornar instância criada com QR Code
    createInstance: async (instanceName: string) => {
      setIsConnecting(true);
      try {
        console.log('[Hook] 🚀 Creating instance - FASE 3.1.3:', instanceName);
        const result = await createInstance(instanceName);
        
        // Retornar a instância criada para que o componente possa capturar o QR Code
        return result;
      } finally {
        setIsConnecting(false);
      }
    },
    deleteInstance,
    refreshQRCode: refreshInstanceQRCode,
    closeQRModal
  };
};
