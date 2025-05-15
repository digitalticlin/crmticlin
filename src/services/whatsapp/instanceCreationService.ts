
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppStatus } from "@/hooks/whatsapp/database";
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
    // propaga objeto completo do response se houver
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
  // Buscar nomes locais
  const { data: localData } = await supabase.from("whatsapp_numbers").select("instance_name");
  const local: string[] = (localData || [])
    .map((row: any) => row.instance_name?.toLowerCase?.() || "")
    .filter(Boolean);

  // Buscar nomes na Evolution
  let evolution: string[] = [];
  try {
    evolution = await fetchEvolutionInstanceNames();
  } catch (err) {
    // Continua, ao menos previne colisão local
  }

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
 * Cria nova instância WhatsApp, nomeando incrementalmente conforme regra.
 */
export const createWhatsAppInstance = async (username: string): Promise<{
  success: boolean;
  qrCode?: string;
  instanceName?: string;
  instanceId?: string;
  error?: string;
}> => {
  let baseName = username.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  let tryCount = 0;
  let lastError: string | undefined;
  let newName = baseName;
  let instanceData: any;

  while (tryCount < 10) {
    try {
      // Sempre garante nome incremental possível
      if (tryCount > 0) {
        newName = await makeUniqueInstanceName(baseName);
      }
      // POST na Evolution
      const evolutionResp: EvolutionInstance = await evolutionRequest(
        "/instance/create", {
        method: "POST",
        body: JSON.stringify({
          instanceName: newName,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        }),
      });
      // Checa dados essenciais
      if (
        !evolutionResp ||
        !evolutionResp.qrcode?.base64 ||
        !evolutionResp.instanceId
      ) {
        throw new Error("QR code ou dados ausentes na resposta da Evolution API");
      }

      // Salvar no banco
      const userResult = await supabase.auth.getUser();
      const userId = userResult.data.user?.id;

      const { data: profileData } = await supabase.from("profiles").select("company_id").eq("id", userId).single();
      if (!profileData?.company_id) throw new Error("Erro ao obter a empresa do usuário");
      const companyId = profileData.company_id;

      const whatsappData = {
        instance_name: newName,
        phone: "",
        company_id: companyId,
        status: "connecting" as WhatsAppStatus,
        qr_code: evolutionResp.qrcode.base64,
        instance_id: evolutionResp.instanceId,
        evolution_instance_name: evolutionResp.instanceName,
        evolution_token: evolutionResp.hash || "",
      };

      const { data: insertData, error: dbError } = await supabase
        .from('whatsapp_numbers')
        .insert(whatsappData)
        .select();

      if (dbError) throw new Error("Erro ao salvar a instância no banco");

      const savedInstance = insertData && Array.isArray(insertData) && insertData.length > 0 ? insertData[0] : null;

      return {
        success: true,
        qrCode: evolutionResp.qrcode.base64,
        instanceName: newName,
        instanceId: savedInstance?.id || evolutionResp.instanceId,
      };
    } catch (err: any) {
      lastError = String((err?.response?.message || err?.message || "Erro ao criar instância"));
      // Trata 403 usando "already in use"
      if (
        err?.status === 403 &&
        ((Array.isArray(err?.response?.message) && `${err?.response?.message[0]}`.toLowerCase().includes("already in use")) ||
          (typeof err?.response?.message === "string" && err?.response?.message.toLowerCase().includes("already in use")))
      ) {
        tryCount += 1;
        continue; // Tentativa extra
      } else {
        break; // Para qualquer outro erro não continua tentando
      }
    }
  }

  // Falha: Não foi possível criar, mostrar suporte.
  return {
    success: false,
    error: lastError || "Não foi possível criar a instância WhatsApp. Fale com nosso suporte."
  };
};
