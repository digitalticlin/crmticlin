
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
  history_imported?: boolean;
}

export const useWhatsAppWebInstances = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQRCode, setSelectedQRCode] = useState<string | null>(null);
  const [selectedInstanceName, setSelectedInstanceName] = useState<string>('');
  
  const { user } = useAuth();

  // CORREÇÃO COMPLETA: Hooks especializados
  const { instances, isLoading, error, fetchInstances, refetch } = useInstancesData();
  const { generateIntelligentInstanceName } = useIntelligentNaming();
  
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
        console.log('[Hook] 🚀 CORREÇÃO COMPLETA - Creating instance:', instanceName);
        const result = await createInstance(instanceName);
        return result;
      } finally {
        setIsConnecting(false);
      }
    },
    deleteInstance,
    refreshQRCode: async (instanceId: string) => {
      console.log('[Hook] 🔄 CORREÇÃO COMPLETA - Refreshing QR Code via whatsapp_qr_service:', instanceId);
      // CORREÇÃO: Usar whatsapp_qr_service para QR Code
      const result = await refreshQRCode(instanceId);
      return result;
    },
    closeQRModal
  };
};
