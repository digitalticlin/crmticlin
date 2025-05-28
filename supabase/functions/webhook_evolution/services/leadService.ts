
// deno-lint-ignore-file no-explicit-any
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { extractTextMessage } from "../utils/helpers.ts";
import { LeadData, ExistingLead } from "./leadTypes.ts";
import { findOrCreateKanbanStageId } from "./kanbanStageService.ts";

export async function processLead(
  supabase: SupabaseClient,
  phone: string,
  companyId: string,
  whatsappInstanceId: string, // CORRIGIDO: renomeado de whatsappNumberId
  messageData: any
): Promise<{ leadId: string; leadCreated: boolean; error?: string }> {
  try {
    const { data: existingLead, error: leadError } = await supabase
      .from('leads')
      .select('id, unread_count')
      .eq('phone', phone)
      .eq('company_id', companyId)
      .maybeSingle() as { data: ExistingLead | null, error: any };

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
        whatsapp_number_id: whatsappInstanceId, // CORRIGIDO: usar whatsappInstanceId
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
