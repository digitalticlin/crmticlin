
import { supabase } from "@/integrations/supabase/client";

interface DiagnosticResult {
  test: string;
  success: boolean;
  duration: number;
  details: any;
  timestamp: string;
  recommendations?: string[];
}

interface ComprehensiveDiagnostic {
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
  };
  recommendations: string[];
  timestamp: string;
}

export class VPSDiagnosticService {
  
  static async runComprehensiveDiagnostic(): Promise<ComprehensiveDiagnostic> {
    console.log('[VPS Diagnostic Service] 🚀 Iniciando diagnóstico completo pós-atualização token');
    
    const startTime = Date.now();
    const results: DiagnosticResult[] = [];
    
    const tests = [
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

    // Análise dos resultados
    const analysis = this.analyzeResults(results);
    const overallStatus = this.determineOverallStatus(analysis);
    const recommendations = this.generateRecommendations(results, analysis);
    
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

    console.log('[VPS Diagnostic Service] 📊 Diagnóstico concluído:', {
      status: diagnostic.overallStatus,
      sucessos: diagnostic.successCount,
      falhas: diagnostic.failureCount,
      duracao: `${diagnostic.totalDuration}ms`
    });

    return diagnostic;
  }

  private static analyzeResults(results: DiagnosticResult[]) {
    const connectivity = results.find(r => r.test === 'Conectividade VPS');
    const authentication = results.find(r => r.test === 'Autenticação VPS');
    const services = results.find(r => r.test === 'Serviços VPS');
    const flow = results.find(r => r.test === 'Fluxo Completo (check_server)');

    return {
      connectivity: connectivity?.success ? 'ok' : 'failed' as 'ok' | 'degraded' | 'failed',
      authentication: authentication?.success ? 'ok' : 'failed' as 'ok' | 'failed',
      services: services?.success ? 'ok' : 'failed' as 'ok' | 'partial' | 'failed',
      flow: flow?.success ? 'ok' : 'failed' as 'ok' | 'failed'
    };
  }

  private static determineOverallStatus(analysis: any): 'healthy' | 'warning' | 'critical' {
    const failedComponents = Object.values(analysis).filter(status => status === 'failed').length;
    
    if (failedComponents === 0) return 'healthy';
    if (failedComponents <= 1) return 'warning';
    return 'critical';
  }

  private static generateRecommendations(results: DiagnosticResult[], analysis: any): string[] {
    const recommendations: string[] = [];

    if (analysis.connectivity === 'failed') {
      recommendations.push('🔧 Verificar conectividade de rede com a VPS (31.97.24.222:3001)');
      recommendations.push('🔧 Confirmar se a VPS está online e acessível');
    }

    if (analysis.authentication === 'failed') {
      recommendations.push('🔐 Verificar se o token VPS_API_TOKEN foi atualizado corretamente no Supabase');
      recommendations.push('🔐 Confirmar se o token na VPS corresponde ao configurado no Supabase');
    }

    if (analysis.services === 'failed') {
      recommendations.push('⚙️ Verificar se o servidor WhatsApp Web.js está rodando na VPS');
      recommendations.push('⚙️ Reiniciar serviços WhatsApp na VPS se necessário');
    }

    if (analysis.flow === 'failed') {
      recommendations.push('🔄 Verificar integração completa entre Supabase Edge Functions e VPS');
      recommendations.push('🔄 Testar criação manual de instância para identificar ponto de falha');
    }

    // Recomendações específicas baseadas nos detalhes
    results.forEach(result => {
      if (result.recommendations) {
        recommendations.push(...result.recommendations);
      }
    });

    return [...new Set(recommendations)]; // Remove duplicatas
  }

  static formatDiagnosticReport(diagnostic: ComprehensiveDiagnostic): string {
    const statusEmoji = {
      'healthy': '🟢',
      'warning': '🟡', 
      'critical': '🔴'
    };

    const analysisEmoji = {
      'ok': '✅',
      'degraded': '⚠️',
      'partial': '⚠️',
      'failed': '❌'
    };

    let report = `
# 📋 DIAGNÓSTICO VPS - PÓS-ATUALIZAÇÃO TOKEN

## ${statusEmoji[diagnostic.overallStatus]} STATUS GERAL: ${diagnostic.overallStatus.toUpperCase()}

**Resumo dos Testes:**
- ✅ Sucessos: ${diagnostic.successCount}/${diagnostic.totalTests}
- ❌ Falhas: ${diagnostic.failureCount}/${diagnostic.totalTests} 
- ⏱️ Duração total: ${diagnostic.totalDuration}ms
- 📅 Executado em: ${new Date(diagnostic.timestamp).toLocaleString()}

## 🔍 ANÁLISE POR COMPONENTE

| Componente | Status | Resultado |
|------------|---------|-----------|
| 🌐 Conectividade VPS | ${analysisEmoji[diagnostic.analysis.connectivity]} | ${diagnostic.analysis.connectivity.toUpperCase()} |
| 🔐 Autenticação VPS | ${analysisEmoji[diagnostic.analysis.authentication]} | ${diagnostic.analysis.authentication.toUpperCase()} |
| ⚙️ Serviços VPS | ${analysisEmoji[diagnostic.analysis.services]} | ${diagnostic.analysis.services.toUpperCase()} |
| 🔄 Fluxo Completo | ${analysisEmoji[diagnostic.analysis.flow]} | ${diagnostic.analysis.flow.toUpperCase()} |

## 📊 DETALHES DOS TESTES
`;

    diagnostic.results.forEach((result, index) => {
      const emoji = result.success ? '✅' : '❌';
      report += `
### ${index + 1}. ${emoji} ${result.test}
- **Status:** ${result.success ? 'SUCESSO' : 'FALHA'}
- **Duração:** ${result.duration}ms
- **Timestamp:** ${new Date(result.timestamp).toLocaleString()}
`;

      if (!result.success && result.details.error) {
        report += `- **Erro:** ${result.details.error}\n`;
      }
    });

    if (diagnostic.recommendations.length > 0) {
      report += `
## 🔧 RECOMENDAÇÕES DE CORREÇÃO

${diagnostic.recommendations.map(rec => `- ${rec}`).join('\n')}
`;
    }

    return report;
  }
}
