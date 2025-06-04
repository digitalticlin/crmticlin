
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
  
  // CORREÇÃO: Criar wrapper function que retorna void para compatibilidade de tipos
  const fetchInstancesVoid = async () => {
    await fetchInstances();
  };
  
  const { refreshInstanceQRCode } = useInstanceQRCode(instances, fetchInstancesVoid);
  const { createInstance, deleteInstance, refreshQRCode } = useInstanceActions(fetchInstancesVoid);

  // Close QR Modal
  const closeQRModal = () => {
    setShowQRModal(false);
    setSelectedQRCode(null);
    setSelectedInstanceName('');
  };

  // CORREÇÃO 6: QR Code polling otimizado - reduzir de 30s para 90s
  useEffect(() => {
    if (!instances.length) return;

    const checkForQRUpdates = () => {
      instances.forEach(async (instance) => {
        if (instance.web_status === 'waiting_scan' && instance.vps_instance_id) {
          const lastUpdate = instance.updated_at ? new Date(instance.updated_at) : new Date(0);
          const now = new Date();
          const timeDiff = now.getTime() - lastUpdate.getTime();
          
          // CORREÇÃO: Aumentar intervalo de 30s para 90s para reduzir carga
          if (timeDiff > 90000) { // 90 segundos ao invés de 30
            console.log('[WhatsApp Web Instances] 🔄 Auto-refresh QR Code (90s interval):', instance.instance_name);
            await refreshInstanceQRCode(instance.id);
          }
        }
      });
    };

    // CORREÇÃO: Verificar a cada 60 segundos ao invés de 30
    const interval = setInterval(checkForQRUpdates, 60000);

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
    generateIntelligentInstanceName,
    createInstance: async (instanceName: string) => {
      setIsConnecting(true);
      try {
        console.log('[Hook] 🚀 Creating instance (otimizado):', instanceName);
        const result = await createInstance(instanceName);
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
