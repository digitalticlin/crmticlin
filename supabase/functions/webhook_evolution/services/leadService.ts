
// deno-lint-ignore-file no-explicit-any
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { extractTextMessage } from "../utils/helpers.ts";

interface LeadData {
  company_id: string;
  whatsapp_number_id: string;
  name: string;
  phone: string;
  kanban_stage_id: string | null;
  last_message: string | null;
  last_message_time: string;
  unread_count: number;
}

interface ExistingLead {
  id: string;
  unread_count?: number;
  // Add other properties if needed
}

async function findOrCreateKanbanStageId(supabase: SupabaseClient, companyId: string): Promise<string | null> {
  // Buscar a etapa de entrada de leads no kanban
  const { data: entryStage, error: stageError } = await supabase
    .from('kanban_stages')
    .select('id')
    .eq('company_id', companyId)
    .eq('is_fixed', true)
    .ilike('title', '%entrada%leads%')
    .maybeSingle(); // Use maybeSingle to handle no rows gracefully

  if (stageError && !entryStage) { 
    console.log("Etapa de entrada não encontrada pelo nome, buscando o primeiro estágio...", stageError);
    const { data: firstStage, error: firstStageError } = await supabase
      .from('kanban_stages')
      .select('id')
      .eq('company_id', companyId)
      .order('order_position', { ascending: true })
      .limit(1)
      .maybeSingle();
      
    if (!firstStageError && firstStage) {
      return firstStage.id;
    } else {
      console.error("Não foi possível encontrar nenhum estágio de kanban:", firstStageError || "Nenhum estágio encontrado.");
      return null;
    }
  } else if (entryStage) {
    return entryStage.id;
  }
  return null;
}

export async function processLead(
  supabase: SupabaseClient,
  phone: string,
  companyId: string,
  whatsappNumberId: string,
  messageData: any
): Promise<{ leadId: string; leadCreated: boolean; error?: string }> {
  try {
    const { data: existingLead, error: leadError } = await supabase
      .from('leads')
      .select('id, unread_count')
      .eq('phone', phone)
      .eq('company_id', companyId)
      .maybeSingle();

    if (leadError) {
      console.error("Erro ao verificar lead:", leadError);
      return { leadId: "", leadCreated: false, error: "Erro ao verificar lead" };
    }

    let leadId: string;
    let leadCreated = false;

    if (!existingLead) {
      const pushName = messageData.pushName || null;
      const leadName = pushName ? pushName : `Lead-${phone.substring(phone.length - 4)}`;
      
      const kanbanStageId = await findOrCreateKanbanStageId(supabase, companyId);

      const leadPayload: LeadData = {
        company_id: companyId,
        whatsapp_number_id: whatsappNumberId,
        name: leadName,
        phone: phone,
        kanban_stage_id: kanbanStageId,
        last_message: extractTextMessage(messageData),
        last_message_time: new Date().toISOString(),
        unread_count: 1,
      };
      
      const { data: newLead, error: createLeadError } = await supabase
        .from('leads')
        .insert(leadPayload)
        .select('id')
        .single();

      if (createLeadError) {
        console.error("Erro ao criar lead:", createLeadError);
        return { leadId: "", leadCreated: false, error: "Erro ao criar lead" };
      }
      
      leadId = newLead.id;
      leadCreated = true;
      console.log(`Novo lead ${leadId} criado e adicionado ao estágio ${kanbanStageId || 'N/A'}`);

    } else {
      leadId = existingLead.id;
      await supabase
        .from('leads')
        .update({
          unread_count: (existingLead.unread_count || 0) + 1,
          last_message: extractTextMessage(messageData),
          last_message_time: new Date().toISOString(),
        })
        .eq('id', leadId);
      console.log(`Lead ${leadId} existente atualizado`);
    }
    return { leadId, leadCreated };
  } catch (err) {
    console.error("Erro ao processar lead:", err);
    return { leadId: "", leadCreated: false, error: String(err.message || err) };
  }
}
