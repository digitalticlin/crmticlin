
export interface HealthCheckResult {
  online: boolean;
  data?: any;
  attempt: number;
  status?: number;
  error?: string;
}

export interface ServiceStatus {
  api_server: boolean;
  whatsapp_server: boolean;
  api_details: HealthCheckResult;
  whatsapp_details: HealthCheckResult;
  retry_info: {
    api_attempts: number;
    whatsapp_attempts: number;
    timeout_used: string;
    max_retries: number;
  };
}

export interface DeployResponse {
  success: boolean;
  message: string;
  status?: string;
  api_server_url?: string;
  whatsapp_server_url?: string;
  api_server_health?: any;
  whatsapp_server_health?: any;
  deploy_method?: string;
  diagnostics?: any;
  next_steps?: string[];
  error?: string;
  current_status?: ServiceStatus;
  ssh_instructions?: {
    step1: string;
    step2: string;
    step3: string;
    step4: string;
  };
  deploy_script?: string;
  improvements?: Record<string, string>;
  troubleshooting?: {
    common_issues: string[];
    solutions: string[];
  };
}
