
/**
 * Função dedicada à deleção de instância na Evolution API pelo endpoint correto,
 * sem alterar fluxos globais do projeto.
 */
export async function evolutionDeleteInstance(instanceName: string) {
  const API_URL = "https://ticlin-evolution-api.eirfpl.easypanel.host/instance/delete/" + encodeURIComponent(instanceName);
  const API_KEY = "JTZZDXMpymy7RETTvXdA9VxKdD0Mdj7t"; // (Apenas para frontend/teste)

  const resp = await fetch(API_URL, {
    method: "DELETE",
    headers: {
      "apikey": API_KEY
    }
  });

  const data = await resp.json();
  if (!resp.ok || data.status !== "SUCCESS") {
    throw new Error(data?.response?.message || "Erro ao deletar instância na Evolution API");
  }
  return data;
}
