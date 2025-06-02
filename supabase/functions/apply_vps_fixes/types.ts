
export interface FixStep {
  step: string;
  status: 'pending' | 'running' | 'success' | 'error';
  details: string;
  duration?: number;
  command?: string;
  output?: string;
}

export interface FixResults {
  success: boolean;
  message: string;
  timestamp: string;
  steps: FixStep[];
  api_connection: {
    host: string;
    port: number;
    connected: boolean;
  };
  final_verification: {
    server_version: string;
    ssl_fix_enabled: boolean;
    timeout_fix_enabled: boolean;
    webhook_test_available: boolean;
  };
}

export interface VPSAPIConfig {
  host: string;
  port: number;
  baseUrl: string;
  token: string;
}

export interface APIResponse {
  success: boolean;
  output?: string;
  error?: string;
  duration?: number;
  timestamp?: string;
}
