
import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { useWhatsAppWebInstances } from './useWhatsAppWebInstances';
import { useCompanyData } from '../useCompanyData';

export const useWhatsAppSettingsLogic = () => {
  const [qrModalInstanceId, setQrModalInstanceId] = useState<string | null>(null);
  
  const { companyId, loading: companyLoading } = useCompanyData();
  
  const {
    instances,
    loading,
    error,
    autoConnectState,
    createInstance,
    deleteInstance,
    refreshQRCode,
    syncInstanceStatus,
    forceSync,
    closeQRModal,
    openQRModal,
    refetch
  } = useWhatsAppWebInstances();

  const connectedInstances = instances.filter(instance => 
    ['ready', 'open'].includes(instance.web_status || instance.connection_status) && 
    instance.phone && instance.phone !== ''
  );

  const handleOpenQRModal = (instanceId: string) => {
    setQrModalInstanceId(instanceId);
  };

  const handleCloseQRModal = () => {
    setQrModalInstanceId(null);
  };

  const handleCreateInstance = async () => {
    try {
      await createInstance();
      toast.success('Instância criada com sucesso!');
    } catch (error) {
      console.error('Error creating instance:', error);
      toast.error('Erro ao criar instância');
    }
  };

  const handleDeleteInstance = async (instanceId: string) => {
    try {
      await deleteInstance(instanceId);
      toast.success('Instância removida com sucesso!');
    } catch (error) {
      console.error('Error deleting instance:', error);
      toast.error('Erro ao remover instância');
    }
  };

  const handleRefreshQR = async (instanceId: string) => {
    try {
      await refreshQRCode(instanceId);
      toast.success('QR Code atualizado!');
    } catch (error) {
      console.error('Error refreshing QR:', error);
      toast.error('Erro ao atualizar QR Code');
    }
  };

  const handleSyncStatus = async (instanceId: string) => {
    try {
      await syncInstanceStatus(instanceId);
      toast.success('Status sincronizado!');
    } catch (error) {
      console.error('Error syncing status:', error);
      toast.error('Erro ao sincronizar status');
    }
  };

  const handleForceSync = async (instanceId: string) => {
    try {
      await forceSync(instanceId);
      toast.success('Sincronização forçada realizada!');
    } catch (error) {
      console.error('Error force syncing:', error);
      toast.error('Erro ao forçar sincronização');
    }
  };

  return {
    instances,
    loading: loading || companyLoading,
    error,
    connectedInstances,
    autoConnectState,
    qrModalInstanceId,
    handleOpenQRModal,
    handleCloseQRModal,
    handleCreateInstance,
    handleDeleteInstance,
    handleRefreshQR,
    handleSyncStatus,
    handleForceSync,
    closeQRModal,
    refetch
  };
};
