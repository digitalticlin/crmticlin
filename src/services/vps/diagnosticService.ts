
import { supabase } from "@/integrations/supabase/client";
import type { DiagnosticResult, ComprehensiveDiagnostic, DiagnosticTest } from './types';
import { DiagnosticAnalyzer } from './diagnosticAnalyzer';
import { ReportFormatter } from './reportFormatter';

export class VPSDiagnosticService {
  
  static async runComprehensiveDiagnostic(): Promise<ComprehensiveDiagnostic> {
    console.log('[VPS Diagnostic Service] 🚀 Iniciando diagnóstico completo FASE 2');
    
    const startTime = Date.now();
    const results: DiagnosticResult[] = [];
    
    const tests: DiagnosticTest[] = [
      { name: 'vps_connectivity', label: 'Conectividade VPS' },
      { name: 'vps_auth', label: 'Autenticação VPS' },
      { name: 'vps_services', label: 'Serviços VPS' },
      { name: 'full_flow', label: 'Fluxo Completo (check_server)' }
    ];

    // Executar cada teste
    for (const test of tests) {
      console.log(`[VPS Diagnostic Service] 🧪 Executando: ${test.label}`);
      
      try {
        const { data, error } = await supabase.functions.invoke('vps_diagnostic', {
          body: { 
            test: test.name,
            vpsAction: test.name === 'full_flow' ? 'check_server' : undefined
          }
        });

        if (error) {
          throw error;
        }

        const result: DiagnosticResult = {
          test: test.label,
          success: data.success || false,
          duration: data.duration || 0,
          details: data.details || {},
          timestamp: data.timestamp || new Date().toISOString(),
          recommendations: data.recommendations || []
        };

        results.push(result);
        console.log(`[VPS Diagnostic Service] ${result.success ? '✅' : '❌'} ${test.label}: ${result.success ? 'OK' : 'FALHA'}`);

      } catch (error: any) {
        console.error(`[VPS Diagnostic Service] ❌ Erro no teste ${test.name}:`, error);
        
        const errorResult: DiagnosticResult = {
          test: test.label,
          success: false,
          duration: 0,
          details: { error: error.message },
          timestamp: new Date().toISOString(),
          recommendations: [`Resolver erro: ${error.message}`]
        };
        
        results.push(errorResult);
      }
    }

    // Análise dos resultados CORRIGIDA
    const analysis = DiagnosticAnalyzer.analyzeResults(results);
    const overallStatus = DiagnosticAnalyzer.determineOverallStatus(analysis);
    const recommendations = DiagnosticAnalyzer.generateRecommendations(results, analysis);
    
    const diagnostic: ComprehensiveDiagnostic = {
      overallStatus,
      totalTests: results.length,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length,
      totalDuration: Date.now() - startTime,
      results,
      analysis,
      recommendations,
      timestamp: new Date().toISOString()
    };

    console.log('[VPS Diagnostic Service] 📊 Diagnóstico FASE 2 concluído:', {
      status: diagnostic.overallStatus,
      sucessos: diagnostic.successCount,
      falhas: diagnostic.failureCount,
      duracao: `${diagnostic.totalDuration}ms`
    });

    return diagnostic;
  }

  static formatDiagnosticReport(diagnostic: ComprehensiveDiagnostic): string {
    return ReportFormatter.formatDiagnosticReport(diagnostic);
  }
}

// Export the type for external use
export type { ComprehensiveDiagnostic };
