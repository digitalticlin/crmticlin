import { useState, useEffect } from "react";
import { useAutoConnectionPolling } from "@/hooks/whatsapp/useAutoConnectionPolling";

/**
 * Centraliza flags e lógica de polling imediato/remoto de conexão.
 * Agora NÃO dispara polling automático ao fechar QR: status deve ser lido só do banco (Supabase).
 */
export function useConnectionPolling(instance, showQrCode) {
  // Flags não são mais necessárias para pooling contínuo
  const [isConnectingNow, setIsConnectingNow] = useState(false);

  /**
   * Função de polling: agora roda SOMENTE se chamada manualmente e por tempo limitado
   */
  const startImmediateConnectionPolling = async () => {
    if (!instance.connected) {
      setIsConnectingNow(true);
      // Suporte para polling manual pontual (deprecado para sincronização Supabase)
      // Adicione aqui caso algum fluxo futuro precise de polling temporário.
      setTimeout(() => setIsConnectingNow(false), 3500); // Reseta flag apenas como fallback
      // Não dispara loop/polling! (Apenas marca "conectando" brevemente para feedback visual)
    }
  };

  // Removido o useEffect que disparava polling ao fechar QRCode
  // Apenas reseta flag visual ao abrir modal QR
  useEffect(() => {
    if (showQrCode) {
      setIsConnectingNow(false);
      // Continua permitindo feedback visual ao abrir modal QR.
    }
    // NÃO há mais trigger automático ao fechar modal ou ao mudar estados do QRCode.
  }, [showQrCode]);

  // Retorna função e flag apenas, sem triggers automáticos
  return {
    isConnectingNow,
    startImmediateConnectionPolling,
  };
}
