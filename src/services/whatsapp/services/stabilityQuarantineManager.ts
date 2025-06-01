
interface QuarantinedInstance {
  instanceId: string;
  reason: string;
  quarantinedAt: number;
  failureCount: number;
  lastAttempt: number;
}

export class StabilityQuarantineManager {
  private static quarantinedInstances: Map<string, QuarantinedInstance> = new Map();

  /**
   * Coloca instância em quarentena por 24 horas
   */
  static putInQuarantine(instanceId: string, reason: string, failureCount: number = 1): void {
    const now = Date.now();
    
    const existing = this.quarantinedInstances.get(instanceId);
    
    this.quarantinedInstances.set(instanceId, {
      instanceId,
      reason,
      quarantinedAt: existing?.quarantinedAt || now,
      failureCount: existing ? existing.failureCount + failureCount : failureCount,
      lastAttempt: now
    });

    console.log(`[QuarantineManager] Instância ${instanceId} em quarentena: ${reason} (falhas: ${failureCount})`);
  }

  /**
   * Verifica se instância está em quarentena
   */
  static isInQuarantine(instanceId: string, quarantineDurationMs: number = 86400000): boolean {
    const quarantined = this.quarantinedInstances.get(instanceId);
    
    if (!quarantined) {
      return false;
    }

    const now = Date.now();
    const timeInQuarantine = now - quarantined.quarantinedAt;
    
    if (timeInQuarantine >= quarantineDurationMs) {
      console.log(`[QuarantineManager] Instância ${instanceId} saindo da quarentena após ${Math.round(timeInQuarantine / 3600000)}h`);
      this.quarantinedInstances.delete(instanceId);
      return false;
    }

    return true;
  }

  /**
   * Remove instância da quarentena manualmente
   */
  static removeFromQuarantine(instanceId: string): boolean {
    const removed = this.quarantinedInstances.delete(instanceId);
    if (removed) {
      console.log(`[QuarantineManager] Instância ${instanceId} removida da quarentena manualmente`);
    }
    return removed;
  }

  /**
   * Força recuperação de todas as instâncias em quarentena
   */
  static async forceRecoveryFromQuarantine(): Promise<{
    recovered: number;
    errors: string[];
  }> {
    console.log('[QuarantineManager] Forçando recuperação de instâncias em quarentena...');
    
    const recovered = this.quarantinedInstances.size;
    const errors: string[] = [];

    try {
      // Limpar todas as instâncias da quarentena
      this.quarantinedInstances.clear();
      
      console.log(`[QuarantineManager] ${recovered} instâncias removidas da quarentena`);
      
      return {
        recovered,
        errors
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);
      
      return {
        recovered: 0,
        errors
      };
    }
  }

  /**
   * Obtém status da quarentena
   */
  static getQuarantineStatus(): {
    total: number;
    instances: Array<{
      instanceId: string;
      reason: string;
      timeInQuarantine: number;
      failureCount: number;
    }>;
  } {
    const now = Date.now();
    const instances = Array.from(this.quarantinedInstances.values()).map(q => ({
      instanceId: q.instanceId,
      reason: q.reason,
      timeInQuarantine: now - q.quarantinedAt,
      failureCount: q.failureCount
    }));

    return {
      total: instances.length,
      instances
    };
  }

  /**
   * Limpeza automática de quarentenas expiradas
   */
  static cleanupExpiredQuarantines(quarantineDurationMs: number = 86400000): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [instanceId, quarantined] of this.quarantinedInstances.entries()) {
      if (now - quarantined.quarantinedAt >= quarantineDurationMs) {
        this.quarantinedInstances.delete(instanceId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[QuarantineManager] ${cleaned} quarentenas expiradas removidas automaticamente`);
    }

    return cleaned;
  }

  /**
   * Obtém tempo restante de quarentena
   */
  static getQuarantineTimeRemaining(instanceId: string, quarantineDurationMs: number = 86400000): number {
    const quarantined = this.quarantinedInstances.get(instanceId);
    
    if (!quarantined) {
      return 0;
    }

    const now = Date.now();
    const elapsed = now - quarantined.quarantinedAt;
    const remaining = quarantineDurationMs - elapsed;
    
    return Math.max(0, remaining);
  }
}
