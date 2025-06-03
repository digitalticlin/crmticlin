
import { useState, useEffect, useCallback } from "react";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useAuth } from "@/contexts/AuthContext";
import { DiagnosticReport, defaultReport } from "./types/diagnosticTypes";
import { DiagnosticService } from "./services/diagnosticService";

// Re-export types for backward compatibility
export type {
  DiagnosticCheck,
  DiagnosticReport
} from "./types/diagnosticTypes";

export const useDiagnosticSystem = () => {
  const [report, setReport] = useState<DiagnosticReport>(defaultReport);
  const [isRunning, setIsRunning] = useState(false);
  const { companyId } = useCompanyData();
  const { user } = useAuth();

  const runDiagnostic = useCallback(async () => {
    setIsRunning(true);
    
    try {
      const newReport = await DiagnosticService.runFullDiagnostic(user, companyId);
      setReport(newReport);
      return newReport;
    } catch (error) {
      console.error("Erro durante diagnóstico:", error);
      setReport({
        overall: 'critical',
        checks: [{
          id: 'system-error',
          name: 'Erro do Sistema',
          status: 'error',
          message: 'Falha geral no diagnóstico',
          suggestion: 'Tente novamente ou contate o suporte'
        }],
        lastRun: new Date(),
        summary: 'Falha no diagnóstico do sistema'
      });
    } finally {
      setIsRunning(false);
    }
  }, [companyId, user]);

  // Executar diagnóstico automaticamente na inicialização
  useEffect(() => {
    if (user && companyId) {
      runDiagnostic();
    }
  }, [user, companyId, runDiagnostic]);

  return {
    report,
    isRunning,
    runDiagnostic
  };
};
