
import type { ComprehensiveDiagnostic } from './types';

export class ReportFormatter {
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
