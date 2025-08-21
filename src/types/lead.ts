
export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by_user_id: string;
}

export interface LeadFormData {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}
