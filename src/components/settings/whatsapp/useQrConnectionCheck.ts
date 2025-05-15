
import { useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";

// ATENÇÃO: Aqui está a URL e header corretos:
const API_URL = "https://ticlin-evolution-api.eirfpl.easypanel.host/instance/connectionState/";
const API_KEY = "JTZZDXMpymy7RETTvXdA9VxKdD0Mdj7t";

interface UseQrConnectionCheckParams {
  instanceName?: string | null;
  onConnected: () => void;
  onClosed: () => void;
  onNotExist: (msg: string) => void;
}

/**
 * Checa status de conexão somente quando chamado manualmente pelo botão "Já conectei"
 * Nunca deixa pooling/efeito extra existir. Não faz requisição automaticamente, só via clique ou comando direto.
 */
export function useQrConnectionCheck({ instanceName, onConnected, onClosed, onNotExist }: UseQrConnectionCheckParams) {
  const [isChecking, setIsChecking] = useState(false);
  const hasRequestedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // Faz só UMA requisição ao clicar, e permite cancelar próximas se desmontar
  const checkConnection = async () => {
    if (!instanceName || isChecking || hasRequestedRef.current) return; // só UMA por clique
    setIsChecking(true);
    hasRequestedRef.current = true;

    // Cria AbortController para possível cancelamento
    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const response = await fetch(
        `${API_URL}${encodeURIComponent(instanceName)}`,
        {
          method: "GET",
          headers: {
            "apikey": API_KEY,
            "Content-Type": "application/json"
          },
          signal: abortController.signal
        }
      );
      let json: any = null;
      try {
        json = await response.json();
      } catch {
        throw new Error("Resposta inesperada do servidor");
      }

      const state = json?.instance?.state ?? json?.state;

      // Instância não existe
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

      // Conectado (open/connecting): dispara callback IMEDIATO de sucesso
      if (state === "open" || state === "connecting") {
        toast({ title: "Instância conectada!", description: "Seu WhatsApp foi conectado com sucesso." });
        onConnected();
        setIsChecking(false);
        hasRequestedRef.current = false;
        return;
      }

      // Status "closed"
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

      // Outro estado: alerta de aguardo
      toast({
        title: "Ainda aguardando conexão.",
        description: "Tente novamente em instantes, ou leia o QR Code novamente se necessário.",
        variant: "default"
      });
      setIsChecking(false);
      hasRequestedRef.current = false;
    } catch (error: any) {
      if (error?.name === "AbortError") {
        // Cancelamento: limpa estado, não mostra erro
        setIsChecking(false);
        hasRequestedRef.current = false;
        return;
      }
      toast({
        title: "Erro ao verificar instância",
        description: error?.message || "Problema inesperado ao consultar status.",
        variant: "destructive"
      });
      setIsChecking(false);
      hasRequestedRef.current = false;
    }
  };

  // Limpa estado e aborta requisições pendentes ao desmontar hook ou fechar modal
  const cleanup = () => {
    abortRef.current?.abort();
    setIsChecking(false);
    hasRequestedRef.current = false;
  };

  return { isChecking, checkConnection, cleanup };
}

