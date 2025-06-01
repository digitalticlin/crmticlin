
export interface InstanceData {
  instanceName?: string;
  instanceId?: string;
  vpsInstanceId?: string;
  instanceIds?: string[];
  serverUrl?: string;
}

export interface RequestBody {
  action: string;
  instanceData: InstanceData;
}
