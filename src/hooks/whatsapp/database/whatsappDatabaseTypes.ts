
import { WhatsAppInstance } from "../whatsappInstanceStore";

// Define a type for the allowed status values to match the database enum
export type WhatsAppStatus = "connected" | "connecting" | "disconnected";

// Database record structure
export interface WhatsAppDatabaseRecord {
  id: string;
  instance_name: string;
  phone: string;
  company_id: string;
  status: WhatsAppStatus;
  qr_code: string | null;
  instance_id: string;
  evolution_instance_name: string;
  evolution_token: string;
  date_connected?: string;
  date_disconnected?: string;
}

// Evolution API response types
export interface EvolutionApiResult {
  instance: {
    instanceId: string;
    instanceName: string;
    [key: string]: any;
  };
  hash: string;
  qrcode?: {
    base64?: string;
  };
  [key: string]: any;
}
