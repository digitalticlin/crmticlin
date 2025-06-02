
export interface VersionInfo {
  server: string;
  version: string;
  hash?: string;
  timestamp: string;
  status: 'online' | 'offline' | 'unknown';
  endpoints_available?: string[];
}

export interface DeployResults {
  success: boolean;
  results?: Array<{ message: string }>;
  next_steps?: string[];
}
