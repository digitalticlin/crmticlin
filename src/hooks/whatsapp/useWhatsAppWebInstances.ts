
import { useState } from 'react';
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
  
  const { user } = useAuth();

  // Use specialized hooks
  const { instances, isLoading, error, fetchInstances, refetch } = useInstancesData();
  const { generateIntelligentInstanceName } = useIntelligentNaming();
  
  const fetchInstancesVoid = async () => {
    await fetchInstances();
  };
  
  const { refreshInstanceQRCode } = useInstanceQRCode(instances, fetchInstancesVoid);
  const { createInstance, deleteInstance } = useInstanceActions(fetchInstancesVoid);

  return {
    instances,
    isLoading,
    isConnecting,
    error,
    refetch,
    fetchInstances,
    generateIntelligentInstanceName,
    
    // FUNÇÃO SIMPLIFICADA: Apenas criar instância
    createInstance: async (instanceName: string) => {
      setIsConnecting(true);
      try {
        console.log('[Hook] 🆕 Criando instância (FLUXO ISOLADO):', instanceName);
        const result = await createInstance(instanceName);
        return result;
      } finally {
        setIsConnecting(false);
      }
    },
    
    deleteInstance,
    
    // NOVA FUNÇÃO: Gerar QR Code sob demanda
    generateQRCode: async (instanceId: string) => {
      const result = await refreshInstanceQRCode(instanceId);
      return result;
    }
  };
};
