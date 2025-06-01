
export interface WhatsAppWebInstance {
  id: string;
  instance_name: string;
  connection_type: string;
  server_url: string;
  vps_instance_id: string;
  web_status: string;
  connection_status: string;
  qr_code?: string;
  phone?: string;
  profile_name?: string;
  company_id: string;
  date_connected?: string;
}

export interface AutoConnectState {
  isConnecting: boolean;
  showQRModal: boolean;
  activeInstanceId: string | null;
  error: string | null;
}
