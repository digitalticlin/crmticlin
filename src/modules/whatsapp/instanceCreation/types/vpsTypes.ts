export interface VPSInstanceResponse {
  success: boolean;
  instanceId: string;
  error?: string;
}

export interface VPSQRCodeResponse {
  success: boolean;
  qrCode: string;
  error?: string;
}

export interface VPSStatusResponse {
  success: boolean;
  status: {
    connection: 'pending' | 'connecting' | 'ready' | 'disconnected' | 'error';
    web: 'initializing' | 'running' | 'stopped' | 'error';
  };
  error?: string;
}

export interface VPSWebhookPayload {
  type: 'qr_code' | 'status_update' | 'message';
  instanceId: string;
  data: {
    qrCode?: string;
    status?: {
      connection?: string;
      web?: string;
    };
    message?: {
      id: string;
      from: string;
      to: string;
      body: string;
      timestamp: number;
    };
  };
}
