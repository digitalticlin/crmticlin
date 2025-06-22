
import { useState } from 'react';
import { QRCodeService, QRCodeResult } from '../lib/qrCodeService';
import { toast } from 'sonner';

export const useQRCodeGeneration = (onSuccess?: () => void) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateQRCode = async (instanceId: string): Promise<QRCodeResult | null> => {
    setIsGenerating(true);
    
    try {
      const result = await QRCodeService.generateQRCode({ instanceId });

      if (result.success) {
        if (result.connected) {
          toast.success('Instância já está conectada!');
        } else {
          toast.success('QR Code gerado com sucesso!');
        }
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        if (result.waiting) {
          toast.warning(result.error || 'QR Code ainda não está disponível');
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
