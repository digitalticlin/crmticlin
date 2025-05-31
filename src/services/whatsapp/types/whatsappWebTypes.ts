
export interface WhatsAppWebInstance {
  id: string;
  instanceName: string;
  connectionType: 'web';
  serverUrl: string;
  vpsInstanceId: string;
  webStatus: string;
  connectionStatus: string;
  qrCode?: string;
  phone?: string;
  profileName?: string;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  qrCode?: string; // Add qrCode property for QR code responses
}

export interface InstanceResponse extends ServiceResponse {
  instance?: WhatsAppWebInstance;
}
