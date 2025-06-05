
export interface InstanceData {
  instanceName: string;
  sessionName?: string;
  webhookUrl?: string;
  companyId?: string;
}

export interface VPSInstanceResult {
  success: boolean;
  vpsInstanceId?: string;
  qrCode?: string;
  error?: string;
}

export interface CreateInstanceResponse {
  success: boolean;
  instance?: any;
  error?: string;
  details?: any;
}
