
// deno-lint-ignore-file no-explicit-any

export interface LeadData {
  created_by_user_id: string; // CORREÇÃO: Renomeado de company_id para created_by_user_id
  whatsapp_number_id: string;
  name: string;
  phone: string;
  kanban_stage_id: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export interface ExistingLead {
  id: string;
  unread_count: number;
}
