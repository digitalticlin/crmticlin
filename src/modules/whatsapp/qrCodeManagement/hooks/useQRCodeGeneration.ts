
import { useState } from 'react';
import { QRCodeService, QRCodeResult } from '../lib/qrCodeService';
import { toast } from 'sonner';

interface UseQRCodeGenerationOptions {
  onSuccess?: () => void;
  onModalOpen?: (instanceId: string, instanceName: string) => void;
}

export const useQRCodeGeneration = (options: UseQRCodeGenerationOptions = {}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { onSuccess, onModalOpen } = options;

  const generateQRCode = async (instanceId: string): Promise<QRCodeResult | null> => {
    setIsGenerating(true);
    
    try {
      console.log('[useQRCodeGeneration] 🔄 Gerando QR Code para:', instanceId);
      const result = await QRCodeService.generateQRCode({ instanceId });

      if (result.success) {
        if (result.connected) {
          toast.success('Instância já está conectada!');
        } else {
          toast.success('QR Code gerado com sucesso!');
          
          // Abrir modal após geração bem-sucedida
          if (onModalOpen) {
            console.log('[useQRCodeGeneration] 🚀 Abrindo modal após geração');
            onModalOpen(instanceId, instanceId); // Usando instanceId como instanceName temporariamente
          }
        }
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        if (result.waiting) {
          toast.warning(result.error || 'QR Code ainda não está disponível');
          
          // Mesmo esperando, abrir modal para mostrar loading
          if (onModalOpen) {
            console.log('[useQRCodeGeneration] ⏳ Abrindo modal no estado waiting');
            onModalOpen(instanceId, instanceId); // Usando instanceId como instanceName temporariamente
          }
        } else {
          toast.error(`Erro ao gerar QR Code: ${result.error}`);
        }
      }

      return result;

    } catch (error: any) {
      console.error('[useQRCodeGeneration] ❌ Erro:', error);
      toast.error(`Erro ao gerar QR Code: ${error.message}`);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateQRCode,
    isGenerating
  };
};
