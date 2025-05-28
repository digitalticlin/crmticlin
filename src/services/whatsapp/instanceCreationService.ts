
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppConnectionStatus } from "@/hooks/whatsapp/database";
import { toast } from "sonner";

type EvolutionInstance = {
  instanceId: string;
  instanceName: string;
  qrcode: { base64: string };
  hash?: string;
  status?: string;
};

const EVOLUTION_API_URL = "https://ticlin-evolution-api.eirfpl.easypanel.host";
const API_KEY = "JTZZDXMpymy7RETTvXdA9VxKdD0Mdj7t";

/**
 * Faz requisições para Evolution API com header correto
 */
const evolutionRequest = async (route: string, opts: Partial<RequestInit> = {}) => {
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
 * Busca todos os nomes de instância já existentes na Evolution API
 */
const fetchEvolutionInstanceNames = async (): Promise<string[]> => {
  const data = await evolutionRequest("/instance/fetchInstances", { method: "GET" });
  if (Array.isArray(data.instances)) {
    return data.instances.map((i: any) => i.instanceName?.toLowerCase?.() || "").filter(Boolean);
  }
  return [];
};

/**
 * Gera um nome incremental não colidindo nos bancos local e Evolution
 */
const makeUniqueInstanceName = async (baseName: string): Promise<string> => {
  const { data: localData } = await supabase.from("whatsapp_instances").select("instance_name");
  const local: string[] = (localData || [])
    .map((row: any) => row.instance_name?.toLowerCase?.() || "")
    .filter(Boolean);

  let evolution: string[] = [];
  try {
    evolution = await fetchEvolutionInstanceNames();
  } catch (err) {}

  let highest = 0;
  let exists = false;
  for (const name of [...local, ...evolution]) {
    if (name === baseName.toLowerCase()) {
      exists = true;
      highest = Math.max(highest, 1);
    } else {
      const regex = new RegExp(`^${baseName.toLowerCase()}(\\d+)$`);
      const match = name.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num)) {
          highest = Math.max(highest, num + 1);
        }
      }
    }
  }
  if (!exists && highest === 0) return baseName;
  return `${baseName}${highest > 0 ? highest : 1}`;
};

/**
 * Cria nova instância WhatsApp, nome incremental via Evolution API.
 */
export const createWhatsAppInstance = async (username: string): Promise<{
  success: boolean;
  qrCode?: string;
  instanceName?: string;
  instanceId?: string;
  error?: string;
  triedNames?: string[];
}> => {
  let baseName = username.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  let tryCount = 0;
  let lastError: string | undefined;
  let newName = baseName;
  const triedNames: string[] = [];

  while (tryCount < 10) {
    triedNames.push(newName);
    try {
      if (tryCount > 0) {
        newName = await makeUniqueInstanceName(baseName);
        triedNames.push(newName);
      }
      const evolutionResp = await evolutionRequest(
        "/instance/create", {
        method: "POST",
        body: JSON.stringify({
          instanceName: newName,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        }),
      });

      if (
        !evolutionResp ||
        !evolutionResp.qrcode ||
        !evolutionResp.qrcode.base64 ||
        !evolutionResp.instance ||
        !evolutionResp.instance.instanceId
      ) {
        throw new Error("QR code ou dados ausentes na resposta da Evolution API");
      }

      const userResult = await supabase.auth.getUser();
      const userId = userResult.data.user?.id;

      const { data: profileData } = await supabase.from("profiles").select("company_id").eq("id", userId).single();
      if (!profileData?.company_id) throw new Error("Erro ao obter a empresa do usuário");
      const companyId = profileData.company_id;

      const whatsappData = {
        instance_name: newName,
        phone: "",
        company_id: companyId,
        connection_status: "connecting" as WhatsAppConnectionStatus,
        qr_code: evolutionResp.qrcode.base64,
        instance_id: evolutionResp.instance.instanceId,
        evolution_instance_name: evolutionResp.instance.instanceName,
        evolution_token: evolutionResp.hash || "",
      };

      const { data: insertData, error: dbError } = await supabase
        .from('whatsapp_instances')
        .insert(whatsappData)
        .select();

      if (dbError) throw new Error("Erro ao salvar a instância no banco");

      const savedInstance = insertData && Array.isArray(insertData) && insertData.length > 0 ? insertData[0] : null;

      return {
        success: true,
        qrCode: evolutionResp.qrcode.base64,
        instanceName: newName,
        instanceId: savedInstance?.id || evolutionResp.instance.instanceId,
        triedNames
      };
    } catch (err: any) {
      // Lógica principal de incremento
      const alreadyUsed = (
        err?.status === 403 &&
        (
          (Array.isArray(err?.response?.message) &&
            err?.response?.message.some((m: string) => m.toLowerCase().includes("already in use"))) ||
          (typeof err?.response?.message === "string" &&
            err?.response?.message.toLowerCase().includes("already in use"))
        )
      );

      lastError = String(
        (err?.response?.message && Array.isArray(err.response.message)
          ? err.response.message[0]
          : err?.response?.message || err?.message || "Erro ao criar instância"
        )
      );

      if (alreadyUsed) {
        tryCount += 1;
        continue;
      } else {
        // Outro erro: retorna explicitamente para informar frontend
        return {
          success: false,
          error: lastError || "Não foi possível criar a instância WhatsApp. Fale com nosso suporte.",
          triedNames
        };
      }
    }
  }

  // Falha: Não foi possível criar, mostrar todos nomes tentados para troubleshooting.
  return {
    success: false,
    error: lastError || "Não foi possível criar a instância WhatsApp. Nomes usados: " + triedNames.join(", "),
    triedNames
  };
};
