
import { useState, useCallback } from "react";

interface QRModalState {
  isOpen: boolean;
  instanceId: string | null;
  instanceName: string | null;
  qrCode: string | null;
}

export const useAutoQRModal = () => {
  const [modalState, setModalState] = useState<QRModalState>({
    isOpen: false,
    instanceId: null,
    instanceName: null,
    qrCode: null
  });

  const openQRModal = useCallback((instanceId: string, instanceName: string) => {
    setModalState({
      isOpen: true,
      instanceId,
      instanceName,
      qrCode: null
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState({
      isOpen: false,
      instanceId: null,
      instanceName: null,
      qrCode: null
    });
  }, []);

  const updateQRCode = useCallback((qrCode: string) => {
    setModalState(prev => ({
      ...prev,
      qrCode
    }));
  }, []);

  const retryQRCode = useCallback(async () => {
    // Reset QR code to trigger refresh
    setModalState(prev => ({
      ...prev,
      qrCode: null
    }));
  }, []);

  return {
    modalState,
    openQRModal,
    closeModal,
    updateQRCode,
    retryQRCode
  };
};
