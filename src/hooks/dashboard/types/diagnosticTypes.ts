
export interface DiagnosticCheck {
  id: string;
  name: string;
  status: 'success' | 'warning' | 'error' | 'pending';
  message: string;
  suggestion?: string;
  duration?: number;
}

export interface DiagnosticReport {
  overall: 'healthy' | 'warning' | 'critical';
  checks: DiagnosticCheck[];
  lastRun: Date;
  summary: string;
}

export const defaultReport: DiagnosticReport = {
  overall: 'pending' as any,
  checks: [],
  lastRun: new Date(),
  summary: 'Iniciando diagnóstico...'
};
