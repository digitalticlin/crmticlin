
import type { DiagnosticResult } from './types';
import { VersionValidator } from './versionValidator';

export class DiagnosticAnalyzer {
  static analyzeResults(results: DiagnosticResult[]) {
    const connectivity = results.find(r => r.test === 'Conectividade VPS');
    const authentication = results.find(r => r.test === 'Autenticação VPS');
    const services = results.find(r => r.test === 'Serviços VPS');
    const flow = results.find(r => r.test === 'Fluxo Completo (check_server)');

    // CORREÇÃO: Análise de versão melhorada para aceitar 3.5.0
    let versionStatus: 'ok' | 'outdated' | 'unknown' = 'unknown';
    
    // Verificar versão nos detalhes de conectividade
    if (connectivity?.success && connectivity.details?.version) {
      const version = connectivity.details.version;
      if (VersionValidator.isValidVersion(version)) {
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

  static determineOverallStatus(analysis: any): 'healthy' | 'warning' | 'critical' {
    const failedComponents = Object.values(analysis).filter(status => status === 'failed').length;
    const outdatedComponents = Object.values(analysis).filter(status => status === 'outdated').length;
    
    if (failedComponents === 0 && outdatedComponents === 0) return 'healthy';
    if (failedComponents <= 1 || outdatedComponents > 0) return 'warning';
    return 'critical';
  }

  static generateRecommendations(results: DiagnosticResult[], analysis: any): string[] {
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
}
