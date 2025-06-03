
export interface WhatsAppWebInstance {
  id: string;
  instance_name: string;
  connection_type: string;
  server_url: string;
  vps_instance_id: string;
  web_status: string;
  connection_status: string;
  qr_code?: string | null;
  phone?: string | null;
  profile_name?: string | null;
  profile_pic_url?: string | null;
  date_connected?: string | null;
  date_disconnected?: string | null;
  company_id: string;
}

export interface AutoConnectState {
  isConnecting: boolean;
  showQRModal: boolean;
  activeInstanceId: string | null;
}
