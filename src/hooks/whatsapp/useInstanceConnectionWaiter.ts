
import { useEffect, useRef, useState } from "react";

interface UseInstanceConnectionWaiterProps {
  instanceId: string;
  instanceName: string;
  checkStatusFn: (instanceId: string) => Promise<string>;
  onSuccess: () => void;
  onTimeout?: () => void;
  pollingInterval?: number; // em ms
  timeoutDuration?: number; // em ms
}

export function useInstanceConnectionWaiter({
  instanceId,
  instanceName,
  checkStatusFn,
  onSuccess,
  onTimeout,
  pollingInterval = 5000,
  timeoutDuration = 60000
}: UseInstanceConnectionWaiterProps) {
  const [waiting, setWaiting] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Iniciar espera/polling
  const start = () => {
    setWaiting(true);
    setCancelled(false);
    setTimedOut(false);
  };

  // Cancelar polling
  const cancel = () => {
    setWaiting(false);
    setCancelled(true);
    setTimedOut(false);
    cleanup();
  };

  // Limpar intervals/timeouts
  const cleanup = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  useEffect(() => {
    if (!waiting || cancelled) {
      cleanup();
      return;
    }

    // Timeout: após timeoutDuration, parar polling e disparar onTimeout
    timeoutRef.current = setTimeout(() => {
      setWaiting(false);
      setTimedOut(true);
      if (onTimeout) onTimeout();
      cleanup();
    }, timeoutDuration);

    // Polling status
    intervalRef.current = setInterval(async () => {
      try {
        const status = await checkStatusFn(instanceId);
        if (
          typeof status === "string" &&
          ["open", "connected", "CONNECTED"].includes(status.toLowerCase())
        ) {
          setWaiting(false);
          cleanup();
          onSuccess();
        }
      } catch (e) {
        // Não fazer nada além de continuar tentando até timeout/cancelar
      }
    }, pollingInterval);

    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waiting, cancelled, instanceId, checkStatusFn, onSuccess, timeoutDuration, pollingInterval]);

  return {
    waiting,
    cancelled,
    timedOut,
    start,
    cancel,
  };
}
