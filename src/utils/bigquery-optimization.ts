import React from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SystemStatus {
  totalInstances: number;
  connectedInstances: number;
  pendingInstances: number;
  activePollings: number;
  estimatedQueriesPerHour: number;
  optimizationLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Otimizações para reduzir consultas no BigQuery
 * Implementa sistema inteligente baseado em atividade real
 */
export class BigQueryOptimizer {
  
  /**
   * Verificar status atual do sistema
   */
  static async getSystemStatus(): Promise<SystemStatus> {
    try {
      // Contar instâncias
      const { data: instances } = await supabase
        .from('whatsapp_instances')
        .select('connection_status, web_status, created_at');

      const totalInstances = instances?.length || 0;
      const connectedInstances = instances?.filter(i => 
        ['connected', 'ready', 'open'].includes(i.connection_status)
      ).length || 0;
      const pendingInstances = instances?.filter(i =>
        ['connecting', 'pending', 'initializing'].includes(i.connection_status)
      ).length || 0;

      // Estimar pollings ativos (baseado nos padrões do código)
      let activePollings = 0;
      let estimatedQueriesPerHour = 0;

      // Polling base sempre ativo
      activePollings += 1; // Health monitoring (5 min)
      estimatedQueriesPerHour += 12; // 60min / 5min = 12 queries/hora

      // Se há instâncias pendentes, ativar pollings mais frequentes
      if (pendingInstances > 0) {
        activePollings += 2; // QR + Instance status
        estimatedQueriesPerHour += 120 + 120; // 15s + 30s intervals
      }

      // Se muitas instâncias conectadas, polling de monitoramento
      if (connectedInstances > 2) {
        activePollings += 1; // Instance monitoring
        estimatedQueriesPerHour += 30; // 2 min intervals
      }

      // Determinar nível de otimização necessário
      let optimizationLevel: SystemStatus['optimizationLevel'] = 'low';
      if (estimatedQueriesPerHour > 500) optimizationLevel = 'critical';
      else if (estimatedQueriesPerHour > 200) optimizationLevel = 'high';
      else if (estimatedQueriesPerHour > 100) optimizationLevel = 'medium';

      return {
        totalInstances,
        connectedInstances,
        pendingInstances,
        activePollings,
        estimatedQueriesPerHour,
        optimizationLevel
      };

    } catch (error) {
      console.error('[BigQuery Optimizer] Erro ao verificar status:', error);
      return {
        totalInstances: 0,
        connectedInstances: 0,
        pendingInstances: 0,
        activePollings: 0,
        estimatedQueriesPerHour: 0,
        optimizationLevel: 'low'
      };
    }
  }

  /**
   * Aplicar otimizações baseadas no status atual
   */
  static async applyOptimizations(): Promise<void> {
    const status = await this.getSystemStatus();
    
    console.log('[BigQuery Optimizer] 📊 Status atual:', status);

    // Aplicar otimizações baseadas no nível
    switch (status.optimizationLevel) {
      case 'critical':
        await this.applyCriticalOptimizations();
        break;
      case 'high':
        await this.applyHighOptimizations();
        break;
      case 'medium':
        await this.applyMediumOptimizations();
        break;
      default:
        await this.applyLowOptimizations();
    }
  }

  /**
   * Otimizações críticas - redução máxima de consultas
   */
  private static async applyCriticalOptimizations(): Promise<void> {
    console.log('[BigQuery Optimizer] 🚨 Aplicando otimizações CRÍTICAS');
    
    // Pausar todos os pollings não essenciais
    this.pauseNonEssentialPollings();
    
    // Aumentar todos os intervalos drasticamente
    this.updatePollingIntervals({
      qrPolling: 30000,      // 30s (era 10s)
      statusPolling: 120000, // 2min (era 30s)
      healthMonitoring: 600000 // 10min (era 5min)
    });
  }

  /**
   * Otimizações altas
   */
  private static async applyHighOptimizations(): Promise<void> {
    console.log('[BigQuery Optimizer] ⚠️ Aplicando otimizações ALTAS');
    
    this.updatePollingIntervals({
      qrPolling: 15000,      // 15s
      statusPolling: 60000,  // 1min
      healthMonitoring: 300000 // 5min
    });
  }

  /**
   * Otimizações médias
   */
  private static async applyMediumOptimizations(): Promise<void> {
    console.log('[BigQuery Optimizer] 📊 Aplicando otimizações MÉDIAS');
    
    this.updatePollingIntervals({
      qrPolling: 10000,      // 10s
      statusPolling: 45000,  // 45s
      healthMonitoring: 180000 // 3min
    });
  }

  /**
   * Otimizações baixas - configuração padrão otimizada
   */
  private static async applyLowOptimizations(): Promise<void> {
    console.log('[BigQuery Optimizer] ✅ Aplicando otimizações BAIXAS (padrão)');
    
    this.updatePollingIntervals({
      qrPolling: 10000,      // 10s
      statusPolling: 30000,  // 30s
      healthMonitoring: 120000 // 2min
    });
  }

  /**
   * Pausar pollings não essenciais
   */
  private static pauseNonEssentialPollings(): void {
    // Emitir evento personalizado para pausar pollings
    window.dispatchEvent(new CustomEvent('bigquery-optimization', {
      detail: { action: 'pause-non-essential' }
    }));
  }

  /**
   * Atualizar intervalos de polling
   */
  private static updatePollingIntervals(intervals: {
    qrPolling: number;
    statusPolling: number;
    healthMonitoring: number;
  }): void {
    // Emitir evento personalizado para atualizar intervalos
    window.dispatchEvent(new CustomEvent('bigquery-optimization', {
      detail: { action: 'update-intervals', intervals }
    }));
  }

  /**
   * Verificar se o sistema está dentro dos limites seguros
   */
  static async checkSystemHealth(): Promise<boolean> {
    const status = await this.getSystemStatus();
    
    // Limite seguro: menos de 200 consultas por hora
    const isSafe = status.estimatedQueriesPerHour < 200;
    
    if (!isSafe) {
      console.warn('[BigQuery Optimizer] ⚠️ Sistema próximo dos limites:', {
        queries: status.estimatedQueriesPerHour,
        limit: 200,
        optimization: status.optimizationLevel
      });
    }

    return isSafe;
  }

  /**
   * Relatório detalhado do sistema
   */
  static async generateReport(): Promise<string> {
    const status = await this.getSystemStatus();
    
    return `
🔍 RELATÓRIO DE OTIMIZAÇÃO DO BIGQUERY

📊 Status Atual:
- Total de instâncias: ${status.totalInstances}
- Instâncias conectadas: ${status.connectedInstances}
- Instâncias pendentes: ${status.pendingInstances}
- Pollings ativos: ${status.activePollings}
- Consultas estimadas/hora: ${status.estimatedQueriesPerHour}
- Nível de otimização: ${status.optimizationLevel.toUpperCase()}

🎯 Análise:
${status.optimizationLevel === 'critical' ? '🚨 CRÍTICO: Muitas consultas! Aplicando otimizações máximas.' :
  status.optimizationLevel === 'high' ? '⚠️ ALTO: Consultas excessivas. Reduzindo intervalos.' :
  status.optimizationLevel === 'medium' ? '📊 MÉDIO: Consultas moderadas. Otimizações aplicadas.' :
  '✅ BAIXO: Sistema operando normalmente.'}

💡 Recomendações:
- Manter apenas ${status.pendingInstances > 0 ? 'pollings essenciais durante criação' : 'pollings de saúde geral'}
- Intervalos otimizados conforme atividade real
- Limpeza automática de intervalos órfãos ativa
- Monitoramento condicional implementado

Data: ${new Date().toLocaleString('pt-BR')}
    `.trim();
  }
}

/**
 * Hook para aplicar otimizações automaticamente
 */
export const useBigQueryOptimization = () => {
  // Aplicar otimizações na inicialização
  React.useEffect(() => {
    BigQueryOptimizer.applyOptimizations();
    
    // Verificar periodicamente (a cada 10 minutos)
    const interval = setInterval(() => {
      BigQueryOptimizer.checkSystemHealth();
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    getStatus: BigQueryOptimizer.getSystemStatus,
    applyOptimizations: BigQueryOptimizer.applyOptimizations,
    checkHealth: BigQueryOptimizer.checkSystemHealth,
    generateReport: BigQueryOptimizer.generateReport
  };
}; 