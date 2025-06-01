
export interface VPSCredentials {
  host: string;
  port: number;
  baseUrl: string;
}

export interface InstanceData {
  instanceName?: string;
  instanceId?: string;
  serverUrl?: string;
}

export interface RequestBody {
  action: string;
  instanceData: InstanceData;
}
