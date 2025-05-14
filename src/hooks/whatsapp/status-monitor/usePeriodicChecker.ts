
import { useRef, useCallback } from "react";
import { WhatsAppInstance } from "../whatsappInstanceStore";
import { usePriorityMonitor } from "./usePriorityMonitor";
import { useInstanceStatusChecker } from "./useInstanceStatusChecker";
import { useConnectionSynchronizer } from "./useConnectionSynchronizer";

/**
 * Hook for setting up controlled and limited periodic status checks
 */
export const usePeriodicChecker = () => {
  const { getConnectingInstances, isConnectingInstance, removeConnectingInstance } = usePriorityMonitor();
  const { checkInstanceStatus } = useInstanceStatusChecker();
  const { forceSyncConnectionStatus } = useConnectionSynchronizer();
  // Use a ref so it's global per mount and never duplicated
  const intervalRef = useRef<number | null>(null);
  // Track last fetch time per instance to throttle
  const instanceLastCheck = useRef<Record<string, number>>({});

  /**
   * Central periodic status check with throttle/limite
   */
  const setupPeriodicStatusCheck = useCallback(
    (
      instances: WhatsAppInstance[],
      checkInterval: number = 15000 // 15s default, mas pode ser reduzido se desejar
    ) => {
      if (!instances.length) return null;

      // Estado global para uso em outros hooks/comps
      if (!window._whatsAppInstancesState) {
        window._whatsAppInstancesState = { instances };
      } else {
        window._whatsAppInstancesState.instances = instances;
      }

      console.log("Iniciando status checker centralizado para", instances.length, "instâncias");

      // Função principal que controla a frequência
      const runStatusChecks = () => {
        const now = Date.now();
        const connectingIds = getConnectingInstances();

        // 1º: Instâncias "connecting" (verificação mais rápida, até máx 1x/5s)
        connectingIds.forEach((instanceId, idx) => {
          const instance = instances.find((inst) => inst.id === instanceId);
          if (!instance) return;
          // throttle: máx 1x/5s
          if (!instanceLastCheck.current[instanceId] || now - instanceLastCheck.current[instanceId] > 5000) {
            instanceLastCheck.current[instanceId] = now;
            forceSyncConnectionStatus(instanceId, instance.instanceName).then((status) => {
              // Se conectou, remove da lista de connecting
              if (status === "connected" && isConnectingInstance(instanceId)) {
                removeConnectingInstance(instanceId);
              }
            });
          }
        });

        // 2º: Instâncias desconectadas (máx 1x/15s)
        instances
          .filter((inst) => !inst.connected && !isConnectingInstance(inst.id))
          .forEach((instance) => {
            if (!instanceLastCheck.current[instance.id] || now - instanceLastCheck.current[instance.id] > 15000) {
              instanceLastCheck.current[instance.id] = now;
              forceSyncConnectionStatus(instance.id, instance.instanceName);
            }
          });

        // 3º: Instâncias conectadas (1x/30s)
        instances
          .filter((inst) => inst.connected)
          .forEach((instance) => {
            if (!instanceLastCheck.current[instance.id] || now - instanceLastCheck.current[instance.id] > 30000) {
              instanceLastCheck.current[instance.id] = now;
              forceSyncConnectionStatus(instance.id, instance.instanceName);
            }
          });
      };

      // Executa imediatamente o primeiro ciclo (caso credenciais mudem)
      runStatusChecks();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Executa ciclo a cada checkInterval (15s)
      intervalRef.current = window.setInterval(runStatusChecks, checkInterval);

      return () => {
        // Limpa interval quando desmontar ou trocar
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    },
    [getConnectingInstances, isConnectingInstance, removeConnectingInstance, forceSyncConnectionStatus]
  );

  return {
    setupPeriodicStatusCheck,
  };
};
