
import { useState, useCallback } from 'react';
import { QRCodeManagementService, QRCodeResult } from '../lib/qrCodeManagement';
import { toast } from 'sonner';

export const useQRCodeModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState('');
  const [instanceId, setInstanceId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openModal = useCallback((id: string, name: string) => {
    setInstanceId(id);
    setInstanceName(name);
    setQrCode(null);
    setError(null);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setQrCode(null);
    setInstanceName('');
    setInstanceId('');
    setError(null);
    setIsLoading(false);
  }, []);

  const fetchQRCode = useCallback(async (id?: string): Promise<QRCodeResult> => {
    const targetId = id || instanceId;
    if (!targetId) {
      const error = 'ID da instância não fornecido';
      setError(error);
      return { success: false, error };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await QRCodeManagementService.getQRCode({ instanceId: targetId });
      
      if (result.success && result.qrCode) {
        setQrCode(result.qrCode);
        toast.success('QR Code obtido com sucesso!');
      } else if (result.waiting) {
        setError('QR Code sendo gerado...');
      } else {
        setError(result.error || 'Erro ao obter QR Code');
        toast.error(result.error || 'Erro ao obter QR Code');
      }

      return result;

    } catch (error: any) {
      const errorMsg = error.message || 'Erro inesperado';
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [instanceId]);

  const refreshQRCode = useCallback(async (): Promise<QRCodeResult> => {
    if (!instanceId) {
      const error = 'ID da instância não disponível';
      setError(error);
      return { success: false, error };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await QRCodeManagementService.refreshQRCode({ instanceId });
      
      if (result.success && result.qrCode) {
        setQrCode(result.qrCode);
        toast.success('QR Code atualizado com sucesso!');
      } else {
        setError(result.error || 'Erro ao atualizar QR Code');
        toast.error(result.error || 'Erro ao atualizar QR Code');
      }

      return result;

    } catch (error: any) {
      const errorMsg = error.message || 'Erro inesperado';
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [instanceId]);

  return {
    isOpen,
    qrCode,
    instanceName,
    instanceId,
    isLoading,
    error,
    openModal,
    closeModal,
    fetchQRCode,
    refreshQRCode
  };
};
