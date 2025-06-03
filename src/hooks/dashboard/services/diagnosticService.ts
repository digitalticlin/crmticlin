
import { DiagnosticCheck, DiagnosticReport } from "../types/diagnosticTypes";
import { DiagnosticChecks } from "./diagnosticChecks";
import type { User } from "@supabase/supabase-js";

export class DiagnosticService {
  static async runFullDiagnostic(user: User | null, companyId: string | null): Promise<DiagnosticReport> {
    console.log("=== Iniciando Diagnóstico do Sistema ===");

    const checks: DiagnosticCheck[] = [];

    // Executar verificações sequencialmente
    const checkFunctions = [
      () => DiagnosticChecks.checkConnectivity(),
      () => DiagnosticChecks.checkAuthentication(user, companyId),
      () => DiagnosticChecks.checkTables(companyId),
      () => DiagnosticChecks.checkDataAvailability(companyId),
      () => DiagnosticChecks.checkPerformance(companyId)
    ];

    for (const checkFn of checkFunctions) {
      try {
        const result = await checkFn();
        checks.push(result);
        console.log(`✓ ${result.name}: ${result.status} - ${result.message}`);
      } catch (error) {
        console.error(`Erro na verificação:`, error);
        checks.push({
          id: 'unknown',
          name: 'Verificação Desconhecida',
          status: 'error',
          message: 'Erro inesperado durante verificação'
        });
      }
    }

    // Calcular status geral
    const errorCount = checks.filter(c => c.status === 'error').length;
    const warningCount = checks.filter(c => c.status === 'warning').length;

    let overall: 'healthy' | 'warning' | 'critical';
    let summary: string;

    if (errorCount > 0) {
      overall = 'critical';
      summary = `${errorCount} erro(s) crítico(s) encontrado(s)`;
    } else if (warningCount > 0) {
      overall = 'warning';
      summary = `${warningCount} aviso(s) encontrado(s)`;
    } else {
      overall = 'healthy';
      summary = 'Sistema funcionando normalmente';
    }

    const newReport: DiagnosticReport = {
      overall,
      checks,
      lastRun: new Date(),
      summary
    };

    console.log("=== Diagnóstico Finalizado ===", newReport);
    
    return newReport;
  }
}
