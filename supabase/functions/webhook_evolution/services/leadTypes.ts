
// deno-lint-ignore-file no-explicit-any
export interface LeadData {
  company_id: string;
  whatsapp_number_id: string;
  name: string;
  phone: string;
  kanban_stage_id: string | null;
  last_message: string | null;
  last_message_time: string;
  unread_count: number;
}

export interface ExistingLead {
  id: string;
  unread_count?: number;
  // Add other properties if needed
}
