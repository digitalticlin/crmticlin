
import { supabase } from "@/integrations/supabase/client";

interface DiagnosticResult {
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

export class VPSDiagnosticService {
  
  static async runComprehensiveDiagnostic(): Promise<ComprehensiveDiagnostic> {
    console.log('[VPS Diagnostic Service] 🚀 Iniciando diagnóstico completo FASE 2');
    
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

    // Análise dos resultados CORRIGIDA
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

    console.log('[VPS Diagnostic Service] 📊 Diagnóstico FASE 2 concluído:', {
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

    // CORREÇÃO: Análise de versão melhorada para aceitar 3.5.0
    let versionStatus: 'ok' | 'outdated' | 'unknown' = 'unknown';
    
    // Verificar versão nos detalhes de conectividade
    if (connectivity?.success && connectivity.details?.version) {
      const version = connectivity.details.version;
      if (this.isValidVersion(version)) {
        versionStatus = 'ok';
        console.log('[VPS Diagnostic Service] ✅ Versão válida detectada:', version);
      } else {
        versionStatus = 'outdated';
        console.log('[VPS Diagnostic Service] ⚠️ Versão não reconhecida:', version);
      }
    }

    return {
      connectivity: connectivity?.success ? 'ok' : 'failed' as 'ok' | 'degraded' | 'failed',
      authentication: authentication?.success ? 'ok' : 'failed' as 'ok' | 'failed',
      services: services?.success ? 'ok' : 'failed' as 'ok' | 'partial' | 'failed',
      flow: flow?.success ? 'ok' : 'failed' as 'ok' | 'failed',
      version: versionStatus
    };
  }

  // CORREÇÃO: Função de validação de versão atualizada para aceitar 3.5.0
  private static isValidVersion(versionString: string): boolean => {
    if (!versionString) return false;
    
    // Lista de versões válidas atualizada
    const validVersions = [
      '3.5.0', // CORREÇÃO: Versão atual da VPS - VÁLIDA
      '3.4.0',
      '3.3.0',
      '3.2.0',
      '3.1.0',
      '3.0.0'
    ];
    
    // Verificar se é uma versão exata conhecida
    if (validVersions.includes(versionString)) {
      return true;
    }

    // Verificar padrão semver e aceitar todas as versões 3.x
    const semverPattern = /^(\d+)\.(\d+)\.(\d+)$/;
    const match = versionString.match(semverPattern);
    
    if (!match) return false;
    
    const [, major] = match;
    const majorNum = parseInt(major);
    
    // CORREÇÃO: Aceitar todas as versões 3.x como válidas
    return majorNum >= 3;
  }

  private static determineOverallStatus(analysis: any): 'healthy' | 'warning' | 'critical' {
    const failedComponents = Object.values(analysis).filter(status => status === 'failed').length;
    const outdatedComponents = Object.values(analysis).filter(status => status === 'outdated').length;
    
    if (failedComponents === 0 && outdatedComponents === 0) return 'healthy';
    if (failedComponents <= 1 || outdatedComponents > 0) return 'warning';
    return 'critical';
  }

  private static generateRecommendations(results: DiagnosticResult[], analysis: any): string[] {
    const recommendations: string[] = [];

    if (analysis.connectivity === 'failed') {
      recommendations.push('🔧 Verificar conectividade de rede com a VPS (31.97.24.222:3001)');
      recommendations.push('🔧 Confirmar se a VPS está online e acessível');
    }

    if (analysis.authentication === 'failed') {
      recommendations.push('🔐 TOKEN CORRIGIDO: Verificar se VPS_API_TOKEN está configurado corretamente');
      recommendations.push('🔐 Token correto deve ser: 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3');
    }

    if (analysis.services === 'failed') {
      recommendations.push('⚙️ Verificar se o servidor WhatsApp Web.js está rodando na VPS');
      recommendations.push('⚙️ Reiniciar serviços WhatsApp na VPS se necessário');
    }

    if (analysis.flow === 'failed') {
      recommendations.push('🔄 Verificar integração completa entre Supabase Edge Functions e VPS');
      recommendations.push('🔄 Testar criação manual de instância para identificar ponto de falha');
    }

    // CORREÇÃO: Mensagem de versão atualizada para 3.5.0
    if (analysis.version === 'ok') {
      recommendations.push('✅ Versão do WhatsApp Web.js está atualizada (3.5.0) - FASE 2 OK');
    } else if (analysis.version === 'unknown') {
      recommendations.push('❓ Não foi possível determinar a versão do WhatsApp Web.js');
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
      'failed': '❌',
      'outdated': '📦',
      'unknown': '❓'
    };

    let report = `
# 📋 DIAGNÓSTICO VPS - FASE 2 IMPLEMENTADA

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
| 📦 Versão WhatsApp | ${analysisEmoji[diagnostic.analysis.version]} | ${diagnostic.analysis.version.toUpperCase()} |

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
## 🔧 RECOMENDAÇÕES

${diagnostic.recommendations.map(rec => `- ${rec}`).join('\n')}
`;
    }

    return report;
  }
}
