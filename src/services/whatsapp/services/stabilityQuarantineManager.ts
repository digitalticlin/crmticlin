
import { supabase } from "@/integrations/supabase/client";

interface QuarantineEntry {
  quarantinedAt: Date;
  reason: string;
  failures: number;
}

export class StabilityQuarantineManager {
  private static quarantinedInstances = new Map<string, QuarantineEntry>();

  /**
   * Coloca instância em quarentena em vez de remover
   */
  static putInQuarantine(instanceId: string, reason: string, failures: number) {
    console.log('[QuarantineManager] Colocando em quarentena (NÃO removendo):', instanceId, reason);

    this.quarantinedInstances.set(instanceId, {
      quarantinedAt: new Date(),
      reason,
      failures
    });

    // Atualizar status no banco para indicar problema, mas NÃO remover
    supabase
      .from('whatsapp_instances')
      .update({
        web_status: 'unstable', // Novo status
        updated_at: new Date().toISOString()
      })
      .eq('id', instanceId)
      .then(({ error }) => {
        if (error) {
          console.error('[QuarantineManager] Erro ao marcar como instável:', error);
        } else {
          console.log('[QuarantineManager] Instância marcada como instável (preservada):', instanceId);
        }
      });
  }

  /**
   * Força recuperação de instâncias em quarentena
   */
  static async forceRecoveryFromQuarantine() {
    console.log('[QuarantineManager] Forçando recuperação de instâncias em quarentena...');

    for (const [instanceId, quarantine] of this.quarantinedInstances.entries()) {
      console.log('[QuarantineManager] Recuperando da quarentena:', instanceId);

      // Tentar restaurar status
      const { error } = await supabase
        .from('whatsapp_instances')
        .update({
          web_status: 'ready',
          connection_status: 'open',
          updated_at: new Date().toISOString()
        })
        .eq('id', instanceId);

      if (!error) {
        console.log('[QuarantineManager] Instância recuperada da quarentena:', instanceId);
        this.quarantinedInstances.delete(instanceId);
      }
    }
  }

  /**
   * Verifica se instância está em quarentena
   */
  static isInQuarantine(instanceId: string, quarantineTimeoutMinutes: number = 30): boolean {
    const quarantine = this.quarantinedInstances.get(instanceId);
    if (!quarantine) return false;

    const quarantineExpired = Date.now() - quarantine.quarantinedAt.getTime() > (quarantineTimeoutMinutes * 60 * 1000);
    
    if (quarantineExpired) {
      console.log('[QuarantineManager] Removendo da quarentena:', instanceId);
      this.quarantinedInstances.delete(instanceId);
      return false;
    }

    return true;
  }

  /**
   * Obtém status de quarentena
   */
  static getQuarantineStatus() {
    return Array.from(this.quarantinedInstances.entries()).map(([instanceId, data]) => ({
      instanceId,
      ...data,
      quarantinedFor: Math.floor((Date.now() - data.quarantinedAt.getTime()) / 1000 / 60) + ' minutos'
    }));
  }
}
