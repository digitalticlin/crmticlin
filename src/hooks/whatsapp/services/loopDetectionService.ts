
// FASE 3: Serviço para detectar e prevenir loops infinitos
interface RequestMetrics {
  endpoint: string;
  count: number;
  lastRequest: number;
  intervals: number[];
}

interface LoopDetectionConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerSecond: number;
  cooldownPeriod: number;
  minInterval: number;
}

class LoopDetectionService {
  private requestMetrics: Map<string, RequestMetrics> = new Map();
  private blockedEndpoints: Set<string> = new Set();
  private config: LoopDetectionConfig = {
    maxRequestsPerMinute: 20, // Máximo 20 requests por minuto
    maxRequestsPerSecond: 3,  // Máximo 3 requests por segundo
    cooldownPeriod: 30000,    // 30 segundos de cooldown
    minInterval: 1000         // Mínimo 1 segundo entre requests
  };

  // Verificar se um endpoint está em loop
  isEndpointInLoop(endpoint: string): boolean {
    const metrics = this.requestMetrics.get(endpoint);
    if (!metrics) return false;

    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const oneSecondAgo = now - 1000;

    // Filtrar requests do último minuto
    const recentRequests = metrics.intervals.filter(time => time > oneMinuteAgo);
    
    // Filtrar requests do último segundo
    const veryRecentRequests = metrics.intervals.filter(time => time > oneSecondAgo);

    // Detectar loop se:
    // 1. Muitos requests no último minuto
    // 2. Muitos requests no último segundo
    // 3. Intervalos muito pequenos entre requests
    const isLooping = 
      recentRequests.length > this.config.maxRequestsPerMinute ||
      veryRecentRequests.length > this.config.maxRequestsPerSecond ||
      (metrics.intervals.length > 1 && 
       this.calculateAverageInterval(metrics.intervals.slice(-5)) < this.config.minInterval);

    if (isLooping) {
      console.warn(`[Loop Detection] 🔄 Loop detectado em ${endpoint}:`, {
        requestsPerMinute: recentRequests.length,
        requestsPerSecond: veryRecentRequests.length,
        avgInterval: this.calculateAverageInterval(metrics.intervals.slice(-5)),
        totalRequests: metrics.count
      });

      this.blockEndpoint(endpoint);
      return true;
    }

    return false;
  }

  // Registrar uma nova requisição
  recordRequest(endpoint: string): boolean {
    const now = Date.now();
    
    // Verificar se endpoint está bloqueado
    if (this.blockedEndpoints.has(endpoint)) {
      const metrics = this.requestMetrics.get(endpoint);
      if (metrics && (now - metrics.lastRequest) < this.config.cooldownPeriod) {
        console.warn(`[Loop Detection] ⛔ Endpoint ${endpoint} bloqueado por loop`);
        return false; // Bloquear request
      } else {
        // Período de cooldown passou, desbloquear
        this.unblockEndpoint(endpoint);
      }
    }

    // Registrar métricas
    if (!this.requestMetrics.has(endpoint)) {
      this.requestMetrics.set(endpoint, {
        endpoint,
        count: 0,
        lastRequest: now,
        intervals: []
      });
    }

    const metrics = this.requestMetrics.get(endpoint)!;
    
    // Calcular intervalo desde última requisição
    if (metrics.lastRequest > 0) {
      const interval = now - metrics.lastRequest;
      metrics.intervals.push(now);
      
      // Manter apenas últimas 10 requisições para análise
      if (metrics.intervals.length > 10) {
        metrics.intervals = metrics.intervals.slice(-10);
      }
    }

    metrics.count++;
    metrics.lastRequest = now;

    // Verificar se está em loop após registrar
    return !this.isEndpointInLoop(endpoint);
  }

  // Bloquear endpoint temporariamente
  private blockEndpoint(endpoint: string): void {
    this.blockedEndpoints.add(endpoint);
    console.warn(`[Loop Detection] 🚫 Endpoint ${endpoint} bloqueado por ${this.config.cooldownPeriod}ms`);
    
    // Auto-desbloqueio após cooldown
    setTimeout(() => {
      this.unblockEndpoint(endpoint);
    }, this.config.cooldownPeriod);
  }

  // Desbloquear endpoint
  private unblockEndpoint(endpoint: string): void {
    this.blockedEndpoints.delete(endpoint);
    console.log(`[Loop Detection] ✅ Endpoint ${endpoint} desbloqueado`);
  }

  // Calcular intervalo médio entre requests
  private calculateAverageInterval(intervals: number[]): number {
    if (intervals.length < 2) return Infinity;
    
    const diffs = [];
    for (let i = 1; i < intervals.length; i++) {
      diffs.push(intervals[i] - intervals[i - 1]);
    }
    
    return diffs.reduce((sum, diff) => sum + diff, 0) / diffs.length;
  }

  // Obter estatísticas de um endpoint
  getEndpointStats(endpoint: string) {
    const metrics = this.requestMetrics.get(endpoint);
    if (!metrics) return null;

    const now = Date.now();
    const recentRequests = metrics.intervals.filter(time => time > (now - 60000));
    
    return {
      endpoint,
      totalRequests: metrics.count,
      requestsLastMinute: recentRequests.length,
      lastRequest: new Date(metrics.lastRequest).toLocaleString('pt-BR'),
      isBlocked: this.blockedEndpoints.has(endpoint),
      averageInterval: this.calculateAverageInterval(metrics.intervals),
      intervals: metrics.intervals.slice(-5).map(time => 
        new Date(time).toLocaleTimeString('pt-BR')
      )
    };
  }

  // Obter todas as estatísticas
  getAllStats() {
    const stats = Array.from(this.requestMetrics.keys()).map(endpoint => 
      this.getEndpointStats(endpoint)
    ).filter(stat => stat !== null);

    return {
      totalEndpoints: stats.length,
      blockedEndpoints: this.blockedEndpoints.size,
      totalRequests: stats.reduce((sum, stat) => sum + stat!.totalRequests, 0),
      endpointStats: stats,
      config: this.config
    };
  }

  // Limpar métricas antigas
  cleanup(): void {
    const now = Date.now();
    const tenMinutesAgo = now - 600000; // 10 minutos

    for (const [endpoint, metrics] of this.requestMetrics.entries()) {
      if (metrics.lastRequest < tenMinutesAgo) {
        this.requestMetrics.delete(endpoint);
        this.blockedEndpoints.delete(endpoint);
      }
    }

    console.log('[Loop Detection] 🧹 Cleanup executado');
  }

  // Resetar tudo
  reset(): void {
    this.requestMetrics.clear();
    this.blockedEndpoints.clear();
    console.log('[Loop Detection] 🔄 Reset completo executado');
  }
}

// Instância singleton
export const loopDetection = new LoopDetectionService();

// Hook para usar o serviço
export const useLoopDetection = () => {
  const checkRequest = (endpoint: string): boolean => {
    return loopDetection.recordRequest(endpoint);
  };

  const getStats = () => {
    return loopDetection.getAllStats();
  };

  const resetDetection = () => {
    loopDetection.reset();
  };

  return {
    checkRequest,
    getStats,
    resetDetection,
    isBlocked: (endpoint: string) => loopDetection.getEndpointStats(endpoint)?.isBlocked || false
  };
};

// Auto-cleanup a cada 5 minutos
setInterval(() => {
  loopDetection.cleanup();
}, 300000);
