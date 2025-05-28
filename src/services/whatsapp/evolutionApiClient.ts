
const EVOLUTION_API_URL = "https://ticlin-evolution-api.eirfpl.easypanel.host";
const API_KEY = "JTZZDXMpymy7RETTvXdA9VxKdD0Mdj7t";

/**
 * Makes requests to Evolution API with correct headers
 */
export const evolutionRequest = async (route: string, opts: Partial<RequestInit> = {}) => {
  const headers = {
    "Content-Type": "application/json",
    "apikey": API_KEY,
    ...(opts.headers || {}),
  };

  const method = opts.method || "GET";
  const url = `${EVOLUTION_API_URL}${route}`;
  const config = {
    ...opts,
    headers,
    method,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorBody: any = "";
    try {
      errorBody = await response.json();
    } catch {}
    const message =
      errorBody?.error ||
      errorBody?.message ||
      errorBody?.response?.message ||
      response.statusText ||
      "Erro desconhecido";
    const err = new Error(message);
    (err as any).response = errorBody;
    (err as any).status = response.status;
    throw err;
  }
  return response.json();
};

/**
 * Fetches all existing instance names from Evolution API
 */
export const fetchEvolutionInstanceNames = async (): Promise<string[]> => {
  const data = await evolutionRequest("/instance/fetchInstances", { method: "GET" });
  if (Array.isArray(data.instances)) {
    return data.instances.map((i: any) => i.instanceName?.toLowerCase?.() || "").filter(Boolean);
  }
  return [];
};

/**
 * Creates a new instance in Evolution API
 */
export const createEvolutionInstance = async (instanceName: string) => {
  return await evolutionRequest("/instance/create", {
    method: "POST",
    body: JSON.stringify({
      instanceName: instanceName,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS"
    }),
  });
};
