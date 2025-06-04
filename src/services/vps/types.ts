
export interface DiagnosticResult {
  test: string;
  success: boolean;
  duration: number;
  details: any;
  timestamp: string;
  recommendations?: string[];
}

export interface ComprehensiveDiagnostic {
  overallStatus: 'healthy' | 'warning' | 'critical';
  totalTests: number;
  successCount: number;
  failureCount: number;
  totalDuration: number;
  results: DiagnosticResult[];
  analysis: {
    connectivity: 'ok' | 'degraded' | 'failed';
    authentication: 'ok' | 'failed';
    services: 'ok' | 'partial' | 'failed';
    flow: 'ok' | 'failed';
    version: 'ok' | 'outdated' | 'unknown';
  };
  recommendations: string[];
  timestamp: string;
}

export interface DiagnosticTest {
  name: string;
  label: string;
}
