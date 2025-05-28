import { createEvolutionInstance } from "./evolutionApiClient";
import { generateUniqueInstanceName } from "./instanceNameGenerator";
import { saveInstanceToDatabase, getUserCompanyId } from "./instanceDatabaseService";
import { WhatsAppConnectionStatus } from "@/hooks/whatsapp/database";

type EvolutionInstance = {
  instanceId: string;
  instanceName: string;
  qrcode: { base64: string };
  hash?: string;
  status?: string;
};

/**
 * Creates new WhatsApp instance with incremental naming via Evolution API
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
        newName = await generateUniqueInstanceName(baseName);
        triedNames.push(newName);
      }

      const evolutionResp = await createEvolutionInstance(newName);

      if (
        !evolutionResp ||
        !evolutionResp.qrcode ||
        !evolutionResp.qrcode.base64 ||
        !evolutionResp.instance ||
        !evolutionResp.instance.instanceId
      ) {
        throw new Error("QR code ou dados ausentes na resposta da Evolution API");
      }

      const companyId = await getUserCompanyId();

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

      const savedInstance = await saveInstanceToDatabase(whatsappData);

      return {
        success: true,
        qrCode: evolutionResp.qrcode.base64,
        instanceName: newName,
        instanceId: savedInstance?.id || evolutionResp.instance.instanceId,
        triedNames
      };
    } catch (err: any) {
      // Handle "already in use" errors by incrementing the name
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
        // Other error: return explicitly to inform frontend
        return {
          success: false,
          error: lastError || "Não foi possível criar a instância WhatsApp. Fale com nosso suporte.",
          triedNames
        };
      }
    }
  }

  // Failure: Could not create, show all tried names for troubleshooting
  return {
    success: false,
    error: lastError || "Não foi possível criar a instância WhatsApp. Nomes usados: " + triedNames.join(", "),
    triedNames
  };
};
