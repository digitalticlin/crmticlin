
import { useRef, useState, useEffect, useCallback } from "react";

/**
 * Hook para polling automático de status de conexão da instância WhatsApp.
 * - Dispara checagem imediatamente ao ser ativado.
 * - Repete a cada 5s até conectar ("open") ou atingir timeout de 60s.
 */
export function useAutoConnectionPolling({
  active,
  instanceId,
  instanceName,
  onConnected,
  onTimeout
}: {
  active: boolean;
  instanceId: string;
  instanceName: string;
  onConnected: () => void;
  onTimeout: () => void;
}) {
  const [polling, setPolling] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchConnectionStatus = useCallback(async () => {
    setConnecting(true);
    try {
      const res = await fetch(
        `https://ticlin-evolution-api.eirfpl.easypanel.host/instance/connectionState/${encodeURIComponent(instanceName)}`,
        {
          method: "GET",
          headers: {
            "apikey": "JTZZDXMpymy7RETTvXdA9VxKdD0Mdj7t",
            "Content-Type": "application/json",
          },
        }
      );
      const data = await res.json();

      // O backend pode retornar "open" para conectado
      if (data?.state?.toLowerCase() === "open") {
        setConnecting(false);
        setPolling(false);
        if (pollingRef.current) clearInterval(pollingRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        onConnected();
      }
    } catch (e) {
      // Apenas loga, não interrompe polling
      // console.error("Polling error:", e);
    }
  }, [instanceName, onConnected]);

  useEffect(() => {
    if (!active || !instanceId || !instanceName) {
      setConnecting(false);
      setPolling(false);
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }
    setPolling(true);
    setConnecting(true);
    // Dispara checagem imediatamente
    fetchConnectionStatus();

    // Inicia polling a cada 5 segundos
    pollingRef.current = setInterval(() => {
      fetchConnectionStatus();
    }, 5000);

    // Timeout de 60s sem conectar: cancela polling e aciona onTimeout
    timeoutRef.current = setTimeout(() => {
      setConnecting(false);
      setPolling(false);
      if (pollingRef.current) clearInterval(pollingRef.current);
      onTimeout();
    }, 60000);

    // Cleanup
    return () => {
      setConnecting(false);
      setPolling(false);
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [active, instanceId, instanceName, fetchConnectionStatus, onTimeout]);

  return { connecting, polling };
}

