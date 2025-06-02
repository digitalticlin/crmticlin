
export interface VPSCredentials {
  host: string;
  port: number;
  baseUrl: string;
  authToken?: string;
}

export interface RequestBody {
  action: string;
  instanceData: InstanceData;
}

export interface InstanceData {
  instanceName: string;
  instanceId?: string;
  serverUrl?: string;
}

export interface ServiceResponse {
  success: boolean;
  data?: any;
  error?: string;
  instance?: any;
  qrCode?: string;
}

export interface QRCodeResponse {
  success: boolean;
  qrCode?: string;
  error?: string;
}
