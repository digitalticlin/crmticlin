
export interface ConnectionStatusData {
  instanceId: string;
  instanceName: string;
  phone?: string;
  profileName?: string;
  connectionStatus: string;
  webStatus?: string;
}

export interface ConnectionStatusSyncOptions {
  onConnectionDetected?: (data: ConnectionStatusData) => void;
  onModalClose?: () => void;
  onInstanceUpdate?: () => void;
}

export interface ConnectionStatusSyncResult {
  success: boolean;
  data?: ConnectionStatusData;
  error?: string;
}
