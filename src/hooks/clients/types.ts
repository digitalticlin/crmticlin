
export interface ClientData {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  company?: string;
  notes?: string;
  purchase_value?: number;
  created_at: string;
  updated_at: string;
  company_id: string;
}

export interface ClientFormData {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  company?: string;
  notes?: string;
  purchase_value?: number;
}
