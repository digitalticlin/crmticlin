
export interface LeadContact {
  id?: string;
  contact_type: 'phone' | 'email' | 'whatsapp';
  contact_value: string;
  is_primary: boolean;
}

export interface ClientData {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  company?: string;
  notes?: string;
  purchase_value?: number;
  document_type?: 'cpf' | 'cnpj';
  document_id?: string;
  created_at: string;
  updated_at: string;
  created_by_user_id: string;
  contacts?: LeadContact[];
}

export interface ClientFormData {
  name: string;
  document_type?: 'cpf' | 'cnpj';
  document_id?: string;
  phone: string;
  email?: string;
  address?: string;
  company?: string;
  notes?: string;
  purchase_value?: number;
  contacts: LeadContact[];
}
