
export interface QRCodeModalState {
  isOpen: boolean;
  qrCode: string | null;
  isLoading: boolean;
  instanceId: string | null;
  error: string | null;
}

export interface WhatsAppInstance {
  id: string;
  instance_name: string;
  connection_status: string;
  connection_type: string;
  qr_code?: string;
  phone?: string;
  profile_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateInstanceRequest {
  instanceName?: string;
  userEmail: string;
}

export interface CreateInstanceResponse {
  success: boolean;
  instance?: WhatsAppInstance;
  error?: string;
  message?: string;
}
