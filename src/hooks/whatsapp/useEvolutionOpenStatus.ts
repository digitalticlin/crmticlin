
import { useCallback } from "react";

/**
 * Hook para checar se a instância está em estado "open"
 */
export function useEvolutionOpenStatus() {
  const checkIfOpen = useCallback(async (instanceName: string) => {
    const url = `https://ticlin-evolution-api.eirfpl.easypanel.host/instance/connectionState/${encodeURIComponent(instanceName)}`;
    const API_KEY = "JTZZDXMpymy7RETTvXdA9VxKdD0Mdj7t";
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "API-KEY": API_KEY
      }
    });
    if (!response.ok) throw new Error("Erro ao buscar status da instância na Evolution API");
    const result = await response.json();
    // Esperado: { instance: { instanceName, state } }
    if (result && result.instance && result.instance.state === "open") {
      return {
        isOpen: true,
        instance: result.instance,
      }
    }
    return { isOpen: false, raw: result };
  }, []);
  return { checkIfOpen };
}
