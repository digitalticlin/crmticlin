
import { useCallback } from "react";

const EVOLUTION_API = "https://ticlin-evolution-api.eirfpl.easypanel.host/instance/connectionState";
const API_KEY = "JTZZDXMpymy7RETTvXdA9VxKdD0Mdj7t";

// Hook para buscar status da instância via Evolution API
export function useEvolutionInstanceStatus() {
  // Retorna promise com o JSON de status para o nome da instância
  const fetchStatus = useCallback(async (instanceName: string) => {
    const url = `${EVOLUTION_API}/${encodeURIComponent(instanceName)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "API-KEY": API_KEY
      }
    });
    if (!response.ok) throw new Error("Erro ao buscar status da instância na Evolution API");
    return await response.json();
  }, []);
  return { fetchStatus };
}
