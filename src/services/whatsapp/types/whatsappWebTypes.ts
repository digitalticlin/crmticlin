
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
}

export interface InstanceResponse extends ServiceResponse {
  instance?: WhatsAppWebInstance;
}
