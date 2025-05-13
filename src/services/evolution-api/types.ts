
export interface EvolutionInstance {
  instanceName: string;
  instanceId: string;
  integration: string;
  status: "connected" | "connecting" | "disconnected";
  qrcode?: {
    pairingCode: string | null;
    code: string | null;
    base64: string | null;
    count: number;
  };
  hash?: string;
  webhook?: Record<string, any>;
  websocket?: Record<string, any>;
  rabbitmq?: Record<string, any>;
  sqs?: Record<string, any>;
  settings?: Record<string, any>;
}

export interface CreateInstanceResponse {
  instance: {
    instanceName: string;
    instanceId: string;
    integration: string;
    webhookWaBusiness: string | null;
    accessTokenWaBusiness: string;
    status: "connected" | "connecting" | "disconnected";
  };
  hash: string;
  webhook: Record<string, any>;
  websocket: Record<string, any>;
  rabbitmq: Record<string, any>;
  sqs: Record<string, any>;
  settings: {
    rejectCall: boolean;
    msgCall: string;
    groupsIgnore: boolean;
    alwaysOnline: boolean;
    readMessages: boolean;
    readStatus: boolean;
    syncFullHistory: boolean;
    wavoipToken: string;
  };
  qrcode: {
    pairingCode: string | null;
    code: string | null;
    base64: string | null;
    count: number;
  };
}

export interface FetchInstancesResponse {
  instances: Array<{
    instanceName: string;
    instanceId: string;
    integration: string;
    status: "connected" | "connecting" | "disconnected";
  }>;
}

// Type for Evolution API result - needed for database operations
export interface EvolutionApiResult {
  instance: {
    instanceId: string;
    instanceName: string;
    integration: string;
    status: string;
    [key: string]: any;
  };
  hash: string;
  qrcode?: {
    base64?: string;
    code?: string | null;
    pairingCode?: string | null;
    count?: number;
  };
  webhook?: Record<string, any>;
  websocket?: Record<string, any>;
  rabbitmq?: Record<string, any>;
  sqs?: Record<string, any>;
  settings?: Record<string, any>;
  [key: string]: any;
}
