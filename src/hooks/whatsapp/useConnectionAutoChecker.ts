
import { useState, useRef, useCallback } from "react";

// Faz polling automático até status "open" ou timeout [máx 60s]
export function useConnectionAutoChecker(instanceId: string, instanceName: string | undefined) {
  const [isWaiting, setIsWaiting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Função para buscar status na API Evolution
  const fetchStatus = useCallback(async (): Promise<"open" | "connecting" | "closed" | string> => {
    try {
      if (!instanceName) return "closed";
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
      const json = await res.json();
      if (json && json.state) return String(json.state).toLowerCase();
      return "closed";
    } catch {
      return "closed";
    }
  }, [instanceName]);

  // Inicia o processo de check automático
  const start = useCallback(() => {
    setIsWaiting(true);
    setIsConnected(false);

    // Limpa intervalos prévios, se existir
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Primeiro fetch imediato!
    fetchStatus().then((state) => {
      if (state === "open") {
        setIsConnected(true);
        setIsWaiting(false);
      } else {
        setIsConnected(false);
        setIsWaiting(true);
        // Inicia polling a cada 5s
        intervalRef.current = setInterval(async () => {
          const state = await fetchStatus();
          if (state === "open") {
            setIsConnected(true);
            setIsWaiting(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
          }
        }, 5000);
        // Timeout de até 60s
        timeoutRef.current = setTimeout(() => {
          setIsWaiting(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
        }, 60000);
      }
    });
  }, [fetchStatus]);

  // Cleanup ao desmontar
  const stop = () => {
    setIsWaiting(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  return { isWaiting, isConnected, start, stop };
}
