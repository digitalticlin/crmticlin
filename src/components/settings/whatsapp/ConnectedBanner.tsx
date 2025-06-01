
import React, { useEffect } from "react";
import { toast } from "@/hooks/use-toast";

interface ConnectedBannerProps {
  status?: string;
  shouldShowToast?: boolean;
}

export const ConnectedBanner: React.FC<ConnectedBannerProps> = ({ status, shouldShowToast }) => {
  useEffect(() => {
    if (status === "open" && shouldShowToast) {
      toast({
        title: "✅ WhatsApp conectado com sucesso",
        description: "Aguardando mensagens...",
        duration: 5000,
      });
    }
  }, [status, shouldShowToast]);

  // Não renderiza mais nada, apenas dispara o toast
  return null;
};

export default ConnectedBanner;
