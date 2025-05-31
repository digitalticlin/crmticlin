
import { WhatsAppInstance } from "../whatsappInstanceStore";

// Define a type for the allowed connection_status values to match WhatsApp Web.js
export type WhatsAppConnectionStatus = "open" | "closed" | "connecting" | "disconnected";

// Database record structure - only WhatsApp Web.js fields
export interface WhatsAppDatabaseRecord {
  id: string;
  instance_name: string;
  phone: string;
  company_id: string;
  connection_status: string;
  connection_type: 'web';
  server_url: string;
  vps_instance_id: string;
  web_status: string;
  qr_code: string | null;
  session_data?: any;
  date_connected?: string;
  date_disconnected?: string;
}

// WhatsApp Web.js response types
export interface WhatsAppWebResult {
  instance: {
    instanceId: string;
    instanceName: string;
    [key: string]: any;
  };
  qrCode?: string;
  [key: string]: any;
}
