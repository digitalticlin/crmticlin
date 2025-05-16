
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.42.6";
import { resolveCompanyId } from "./prefixUtils.ts";

interface EvolutionInstanceRaw {
  id?: string;
  name?: string;
  instanceName?: string;
  number?: string;
  phone?: string;
  connectionStatus?: string;
  token?: string;
  ownerJid?: string;
  profileName?: string;
  profilePicUrl?: string;
  clientName?: string;
  [key: string]: any;
}

export interface SyncResult {
  checked: number;
  already_exists: number;
  company_not_found: number;
  inserted: number;
  details_inserted: string[];
  errors: any[];
  skipped_without_phone?: number;
}

export async function insertMissingInstances({
  supabase,
  evoInstances,
  prefix,
  prefixMap,
  existingNames,
}: {
  supabase: any;
  evoInstances: any[];
  prefix: string | null;
  prefixMap: { [prefix: string]: string };
  existingNames: Set<string>;
}): Promise<SyncResult> {
  const filteredEvoInstances = prefix
    ? evoInstances.filter(
        (inst) => (inst.name || inst.instanceName || "").toLowerCase().startsWith(prefix)
      )
    : evoInstances;

  console.log(`[SYNC] Fetched from Evolution: count=${filteredEvoInstances.length}`);
  if (filteredEvoInstances.length) {
    console.log(`[SYNC] First examples:`, filteredEvoInstances.slice(0, 2));
  }

  const inserts = [];
  let skippedNotFound = 0;
  let skippedAlreadyExists = 0;
  let skippedWithoutPhone = 0;
  let createdCount = 0;
  let errors: any[] = [];

  for (const instRaw of filteredEvoInstances as EvolutionInstanceRaw[]) {
    const instanceName = (instRaw.name || instRaw.instanceName || "").toLowerCase();
    if (!instanceName) {
      console.warn(`[SYNC][skip] Instância sem nome, objeto:`, instRaw);
      continue;
    }
    if (existingNames.has(instanceName)) {
      skippedAlreadyExists++;
      continue;
    }
    const company_id = resolveCompanyId(instanceName, prefixMap);
    if (!company_id) {
      console.warn(`[SYNC][skip] Sem company_id correspondente para: ${instanceName}. prefixMap=`, prefixMap);
      skippedNotFound++;
      continue;
    }
    // Corrigir: não inserir instâncias sem número de telefone
    const phoneValue = instRaw.number || instRaw.phone || null;
    if (!phoneValue) {
      skippedWithoutPhone++;
      console.warn(`[SYNC][skip] Instância ignorada, sem número de telefone: ${instanceName}. Dados:`, instRaw);
      continue;
    }
    inserts.push({
      company_id,
      instance_name: instanceName,
      phone: phoneValue,
      status:
        instRaw.connectionStatus === "open"
          ? "connected"
          : "disconnected",
      qr_code: null,
      evolution_instance_id: instRaw.id || null,
      evolution_instance_name: instRaw.name || null,
      evolution_token: instRaw.token || null,
      connection_status: instRaw.connectionStatus || null,
      owner_jid: instRaw.ownerJid || null,
      profile_name: instRaw.profileName || null,
      profile_pic_url: instRaw.profilePicUrl || null,
      client_name: instRaw.clientName || null,
    });
  }
  if (inserts.length > 0) {
    const { error: insertErr } = await supabase
      .from("whatsapp_numbers")
      .insert(inserts);
    if (insertErr) {
      errors.push(insertErr);
      console.error("[SYNC][error-insert]", insertErr);
      throw insertErr;
    }
    createdCount = inserts.length;
    console.log(`[SYNC] Inseridos:`, inserts.map((i) => i.instance_name));
  }
  return {
    checked: filteredEvoInstances.length,
    already_exists: skippedAlreadyExists,
    company_not_found: skippedNotFound,
    inserted: createdCount,
    details_inserted: inserts.map((i) => i.instance_name),
    errors,
    skipped_without_phone: skippedWithoutPhone,
  };
}
