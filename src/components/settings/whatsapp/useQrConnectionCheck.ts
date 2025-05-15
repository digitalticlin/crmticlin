
import { useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";

const API_URL = "https://ticlin-evolution-api.eirfpl.easypanel.host/instance/connectionState/";
const API_KEY = "JTZZDXMpymy7RETTvXdA9VxKdD0Mdj7t";

interface UseQrConnectionCheckParams {
  instanceName?: string | null;
  onConnected: () => void;
  onClosed: () => void;
  onNotExist: (msg: string) => void;
}

export function useQrConnectionCheck({ instanceName, onConnected, onClosed, onNotExist }: UseQrConnectionCheckParams) {
  const [isChecking, setIsChecking] = useState(false);
  const hasRequestedRef = useRef(false);

  const checkConnection = async () => {
    if (!instanceName || isChecking || hasRequestedRef.current) return;
    setIsChecking(true);
    hasRequestedRef.current = true;
    console.log('[useQrConnectionCheck] checkConnection: requisição única disparada');

    try {
      const response = await fetch(`${API_URL}${encodeURIComponent(instanceName)}`, {
        method: "GET",
        headers: {
          "apikey": API_KEY,
          "Content-Type": "application/json"
        }
      });
      let json: any = null;
      try {
        json = await response.json();
      } catch {
        throw new Error("Resposta inesperada do servidor");
      }
      const state = json?.instance?.state ?? json?.state;

      if (
        (json?.status === 404 || json?.status === "404") &&
        json?.response?.message &&
        Array.isArray(json.response.message) &&
        json.response.message.join(" ").toLowerCase().includes("instance does not exist")
      ) {
        onNotExist(json.response.message?.join(" ") || "Instância não encontrada");
        setIsChecking(false);
        hasRequestedRef.current = false;
        return;
      }

      if (state === "open") {
        toast({ title: "Instância conectada!", description: "Seu WhatsApp foi conectado com sucesso." });
        onConnected();
        setIsChecking(false);
        hasRequestedRef.current = false;
        return;
      }

      if (state === "closed") {
        toast({
          title: "Instância removida.",
          description: "Esse número foi excluído e deve ser reconectado.",
          variant: "destructive"
        });
        onClosed();
        setIsChecking(false);
        hasRequestedRef.current = false;
        return;
      }

      toast({
        title: "Ainda aguardando conexão.",
        description: "Tente novamente em instantes, ou leia o QR Code novamente se necessário.",
        variant: "default"
      });
      setIsChecking(false);
      hasRequestedRef.current = false;
      return;
    } catch (error: any) {
      toast({
        title: "Erro ao verificar instância",
        description: error?.message || "Problema inesperado ao consultar status.",
        variant: "destructive"
      });
      setIsChecking(false);
      hasRequestedRef.current = false;
    }
  };

  return { isChecking, checkConnection };
}
