
import { VPSDiagnosticService } from './diagnosticService';
import type { ComprehensiveDiagnostic } from './types';

export class DiagnosticExecutor {
  
  static async executePlan(): Promise<ComprehensiveDiagnostic> {
    console.log('[Diagnostic Executor] 🚀 EXECUTANDO PLANO DE ANÁLISE VPS - PÓS-ATUALIZAÇÃO TOKEN');
    
    try {
      // FASE 1: EXECUÇÃO DOS TESTES
      console.log('[Diagnostic Executor] 📋 FASE 1: Executando testes via Edge Function...');
      const diagnostic = await VPSDiagnosticService.runComprehensiveDiagnostic();
      
      // FASE 2: ANÁLISE DETALHADA
      console.log('[Diagnostic Executor] 🔍 FASE 2: Analisando resultados...');
      const report = VPSDiagnosticService.formatDiagnosticReport(diagnostic);
      
      // FASE 3: APRESENTAÇÃO DOS RESULTADOS
      console.log('[Diagnostic Executor] 📊 FASE 3: Resultados prontos');
      console.log(report);
      
      // Retornar o diagnóstico para uso no chat
      return diagnostic;
      
    } catch (error) {
      console.error('[Diagnostic Executor] ❌ Erro durante execução do plano:', error);
      throw error;
    }
  }
}
