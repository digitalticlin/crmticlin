
// deno-lint-ignore-file no-explicit-any
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { extractTextMessage } from "../utils/helpers.ts";
import { LeadData, ExistingLead } from "./leadTypes.ts";
import { findOrCreateKanbanStageId } from "./kanbanStageService.ts";

// Função para limpar telefone (equivalente ao frontend)
function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  return phone
    .replace(/@c\.us$/, '')
    .replace(/@s\.whatsapp\.net$/, '')
    .replace(/@g\.us$/, '')
    .replace(/\D/g, '');
}

export async function processLead(
  supabase: SupabaseClient,
  phone: string,
  whatsappInstanceId: string,
  createdByUserId: string, // CORREÇÃO: Receber created_by_user_id em vez de companyId
  messageData: any
): Promise<{ leadId: string; leadCreated: boolean; error?: string }> {
  try {
    // CORREÇÃO: Limpar telefone antes de usar
    const cleanPhone = cleanPhoneNumber(phone);
    
    if (!cleanPhone) {
      return { leadId: "", leadCreated: false, error: "Telefone inválido após limpeza" };
    }

    // CORREÇÃO: Buscar lead baseado em created_by_user_id
    const { data: existingLead, error: leadError } = await supabase
      .from('leads')
      .select('id, unread_count')
      .eq('phone', cleanPhone)
      .eq('created_by_user_id', createdByUserId) // CORREÇÃO: Usar created_by_user_id
      .maybeSingle() as { data: ExistingLead | null, error: any };

    if (leadError) {
      console.error("Erro ao verificar lead:", leadError);
      return { leadId: "", leadCreated: false, error: "Erro ao verificar lead" };
    }

    let leadId: string;
    let leadCreated = false;

    if (!existingLead) {
      const pushName = messageData.pushName || null;
      // CORREÇÃO: Nome do lead sem @c.us
      const leadName = pushName ? pushName : `Lead-${cleanPhone.substring(cleanPhone.length - 4)}`;
      
      const kanbanStageId = await findOrCreateKanbanStageId(supabase, createdByUserId); // CORREÇÃO: Passar userId

      const leadPayload: LeadData = {
        created_by_user_id: createdByUserId, // CORREÇÃO: Usar created_by_user_id
        whatsapp_number_id: whatsappInstanceId,
        name: leadName,
        phone: cleanPhone,
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
