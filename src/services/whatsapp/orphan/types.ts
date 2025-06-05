
export interface OrphanInstance {
  instanceId: string;
  status: string;
  phone?: string;
  profileName?: string;
  companyName?: string;
  isOrphan: boolean;
}

export interface HealthCheckResult {
  orphans: OrphanInstance[];
  inconsistencies: any[];
  recommendations: string[];
}

export interface AdoptionResult {
  success: boolean;
  error?: string;
  instance?: any;
}

export interface StatusCheckResult {
  success: boolean;
  error?: string;
  status?: string;
}
