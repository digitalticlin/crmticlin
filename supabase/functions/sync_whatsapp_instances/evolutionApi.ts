
const EVOLUTION_API_URL = "https://ticlin-evolution-api.eirfpl.easypanel.host/instance/fetchInstances";
const EVOLUTION_API_KEY = "JTZZDXMpymy7RETTvXdA9VxKdD0Mdj7t";

/**
 * Fetches all instances from Evolution API.
 */
export async function fetchEvolutionInstances(): Promise<any[]> {
  const evoResp = await fetch(EVOLUTION_API_URL, {
    method: "GET",
    headers: {
      apikey: EVOLUTION_API_KEY,
      "Content-Type": "application/json",
    },
  });
  if (!evoResp.ok) {
    const errText = await evoResp.text();
    console.error("Error fetching Evolution instances:", evoResp.status, errText);
    throw new Error("Failed to fetch from Evolution API");
  }
  const data = await evoResp.json();
  // Support both array (legacy) and { instances: [...] }
  return Array.isArray(data)
    ? data
    : Array.isArray(data.instances)
    ? data.instances
    : [];
}
