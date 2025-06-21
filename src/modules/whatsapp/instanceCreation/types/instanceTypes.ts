export interface CreateInstanceParams {
  instanceName?: string;
  userEmail?: string;
  companyId?: string;
}

export interface CreateInstanceResult {
  success: boolean;
  instance?: WhatsAppInstance;
  error?: string;
  mode?: 'created' | 'existing';
}

export interface WhatsAppInstance {
  id: string;
  instance_name: string;
  vps_instance_id: string;
  connection_status: string;
  web_status: string;
  qr_code?: string | null;
  company_id?: string;
  created_by_user_id: string;
  server_url: string;
  created_at: string;
  updated_at?: string;
}

export interface QRCodeModalState {
  isOpen: boolean;
  qrCode: string | null;
  isLoading: boolean;
  instanceId: string | null;
  error: string | null;
}