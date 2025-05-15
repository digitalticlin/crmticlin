
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface UseQrCodeConnectionProps {
  instanceName?: string | null;
  onConnected: () => void;
  onFail: (errorMsg: string | undefined) => void;
  onClosed: () => void;
  onNotExist: (errorMsg: string | undefined) => void;
  onFinal?: () => void;
}

const API_URL = "https://ticlin-evolution-api.eirfpl.easypanel.host/instance/connectionState/";
const API_KEY = "JTZZDXMpymy7RETTvXdA9VxKdD0Mdj7t";

export function useQrCodeConnection({
  instanceName,
  onConnected,
  onFail,
  onClosed,
  onNotExist,
  onFinal
}: UseQrCodeConnectionProps) {
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    if (!instanceName) return;
    setIsChecking(true);

    const fetchConnectionState = async (): Promise<any> => {
      const res = await fetch(`${API_URL}${encodeURIComponent(instanceName)}`, {
        method: "GET",
        headers: {
          "apikey": API_KEY,
          "Content-Type": "application/json"
        }
      });
      try {
        return await res.json();
      } catch {
        throw new Error("Resposta inesperada do servidor");
      }
    };

    // 1ª tentativa
    try {
      const json = await fetchConnectionState();
      const state = json?.instance?.state ?? json?.state;

      if (
        (json?.status === 404 || json?.status === "404") &&
        json?.response?.message &&
        Array.isArray(json.response.message) &&
        json.response.message.join(" ").toLowerCase().includes("instance does not exist")
      ) {
        onNotExist(json.response.message?.join(" ") || "Instância não encontrada");
        setIsChecking(false);
        onFinal && onFinal();
        return;
      }

      if (state === "open") {
        onConnected();
        toast({
          title: "Instância conectada!",
          description: "Seu WhatsApp foi conectado com sucesso.",
        });
        setIsChecking(false);
        onFinal && onFinal();
        return;
      }

      if (state === "connecting") {
        setTimeout(async () => {
          try {
            const retryJson = await fetchConnectionState();
            const state2 = retryJson?.instance?.state ?? retryJson?.state;
            if (
              (retryJson?.status === 404 || retryJson?.status === "404") &&
              retryJson?.response?.message &&
              Array.isArray(retryJson.response.message) &&
              retryJson.response.message.join(" ").toLowerCase().includes("instance does not exist")
            ) {
              onNotExist(
                retryJson.response.message?.join(" ") || "Instância não encontrada (2ª tentativa)"
              );
              setIsChecking(false);
              onFinal && onFinal();
              return;
            }
            if (state2 === "open") {
              onConnected();
              toast({
                title: "Instância conectada!",
                description: "Seu WhatsApp foi conectado.",
              });
            } else if (state2 === "closed") {
              onClosed();
              toast({
                title: "Instância removida.",
                description: "Esse número foi excluído e deve ser reconectado.",
                variant: "destructive",
              });
            } else {
              toast({
                title: "Ainda aguardando conexão.",
                description:
                  "Tente novamente em instantes, ou leia o QR Code novamente se necessário.",
                variant: "default",
              });
              onFail("Ainda aguardando conexão após 2 tentativas.");
            }
          } catch (err) {
            onFail("Erro ao consultar status na segunda tentativa.");
          } finally {
            setIsChecking(false);
            onFinal && onFinal();
          }
        }, 10000);
        return;
      }

      if (state === "closed") {
        onClosed();
        toast({
          title: "Instância removida.",
          description: "Esse número foi excluído e deve ser reconectado.",
          variant: "destructive",
        });
        setIsChecking(false);
        onFinal && onFinal();
        return;
      }

      // Resposta inesperada
      toast({
        title: "Erro ao verificar instância",
        description: "Não foi possível conferir o status de conexão.",
        variant: "destructive"
      });
      onFail("Erro ao verificar estado.");
      setIsChecking(false);
      onFinal && onFinal();

    } catch (error: any) {
      onFail(error?.message || "Erro ao consultar status.");
      setIsChecking(false);
      onFinal && onFinal();
    }
  };

  return { isChecking, checkConnection };
}
