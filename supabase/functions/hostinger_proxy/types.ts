
export interface CommandRequest {
  vpsId: string;
  command: string;
  description?: string;
}

export interface SSHResult {
  success: boolean;
  output: string;
  exit_code: number;
  duration: number;
}

export interface VPSConfig {
  hostname: string;
  port: number;
  username: string;
  timeout: number;
}
