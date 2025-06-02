
import { useState, useCallback } from 'react';

interface QRCodeValidationResult {
  isValid: boolean;
  isPlaceholder: boolean;
  errorMessage?: string;
}

export function useQRCodeValidation() {
  const [validationCache, setValidationCache] = useState<Map<string, QRCodeValidationResult>>(new Map());

  const validateQRCode = useCallback((qrCode: string | null | undefined): QRCodeValidationResult => {
    if (!qrCode) {
      return {
        isValid: false,
        isPlaceholder: false,
        errorMessage: 'QR Code não disponível'
      };
    }

    // Verificar cache primeiro
    if (validationCache.has(qrCode)) {
      return validationCache.get(qrCode)!;
    }

    // Verificar formato básico de data URL
    if (!qrCode.startsWith('data:image/')) {
      const result = {
        isValid: false,
        isPlaceholder: false,
        errorMessage: 'QR Code inválido - formato incorreto'
      };
      setValidationCache(prev => new Map(prev).set(qrCode, result));
      return result;
    }

    // Verificar se tem conteúdo base64 suficiente
    const base64Part = qrCode.split(',')[1];
    if (!base64Part || base64Part.length < 100) {
      const result = {
        isValid: false,
        isPlaceholder: true,
        errorMessage: 'QR Code sendo gerado...'
      };
      setValidationCache(prev => new Map(prev).set(qrCode, result));
      return result;
    }

    // QR Code válido
    const result = {
      isValid: true,
      isPlaceholder: false
    };
    setValidationCache(prev => new Map(prev).set(qrCode, result));
    return result;
  }, [validationCache]);

  const clearValidationCache = useCallback(() => {
    setValidationCache(new Map());
  }, []);

  return {
    validateQRCode,
    clearValidationCache
  };
}
