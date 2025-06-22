
export interface DualCreationParams {
  instanceName: string;
  userEmail: string;
  companyId: string;
}

export interface DualCreationResult {
  success: boolean;
  instance?: any;
  vpsResponse?: any;
  error?: string;
  mode: 'dual_success' | 'db_only' | 'failed';
}

export interface SyncResult {
  success: boolean;
  data?: {
    summary: {
      vpsInstances: number;
      dbInstances: number;
      synchronized: number;
      added: number;
      updated: number;
      errors: number;
    };
    instances: any[];
  };
  error?: string;
}

export interface VPSInstanceData {
  instanceId: string;
  instanceName: string;
  status: string;
  phone?: string;
  profileName?: string;
  connected: boolean;
  lastUpdate: string;
  connectionAttempts: number;
  createdByUserId?: string;
}
