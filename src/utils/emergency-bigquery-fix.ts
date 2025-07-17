/**
 * CORREÇÃO DE EMERGÊNCIA PARA QUOTA EXCEEDED NO BIGQUERY
 * 
 * Este arquivo contém funções para pausar imediatamente todos os processos
 * que estão causando excesso de consultas no BigQuery
 */

interface EmergencyState {
  isEmergencyMode: boolean;
  pausedIntervals: number[];
  pausedTimeouts: number[];
  startTime: number;
}

class EmergencyBigQueryFix {
  private static state: EmergencyState = {
    isEmergencyMode: false,
    pausedIntervals: [],
    pausedTimeouts: [],
    startTime: 0
  };

  /**
   * ATIVAR MODO DE EMERGÊNCIA
   * Para todos os intervalos e processos que podem estar sobrecarregando o BigQuery
   */
  static activateEmergencyMode(): void {
    if (this.state.isEmergencyMode) {
      console.log('[Emergency BigQuery] ⚠️ Modo de emergência já ativo');
      return;
    }

    console.log('[Emergency BigQuery] 🚨 ATIVANDO MODO DE EMERGÊNCIA - PAUSANDO TODOS OS PROCESSOS');
    
    this.state.isEmergencyMode = true;
    this.state.startTime = Date.now();

    // 1. Limpar TODOS os intervals ativos no window
    this.clearAllIntervals();

    // 2. Limpar TODOS os timeouts ativos
    this.clearAllTimeouts();

    // 3. Desativar polling automático
    this.disableAutoPolling();

    // 4. Emitir evento global para pausar componentes
    this.notifyComponents('emergency-pause');

    // 5. Mostrar notificação de emergência
    this.showEmergencyNotification();

    console.log('[Emergency BigQuery] ✅ Modo de emergência ativado - todos os processos pausados');
  }

  /**
   * DESATIVAR MODO DE EMERGÊNCIA
   * Reativar apenas os processos essenciais com intervalos seguros
   */
  static deactivateEmergencyMode(): void {
    if (!this.state.isEmergencyMode) {
      console.log('[Emergency BigQuery] ✅ Modo de emergência não estava ativo');
      return;
    }

    console.log('[Emergency BigQuery] 🔄 DESATIVANDO MODO DE EMERGÊNCIA - RETOMANDO OPERAÇÕES SEGURAS');

    this.state.isEmergencyMode = false;
    
    // Notificar componentes para retomar com configurações seguras
    this.notifyComponents('emergency-resume');

    const durationMinutes = Math.round((Date.now() - this.state.startTime) / 1000 / 60);
    console.log(`[Emergency BigQuery] ✅ Modo de emergência desativado após ${durationMinutes} minutos`);

    // Reset state
    this.state.pausedIntervals = [];
    this.state.pausedTimeouts = [];
    this.state.startTime = 0;
  }

  /**
   * Limpar todos os intervalos ativos
   */
  private static clearAllIntervals(): void {
    // Método agressivo para limpar intervals
    // Como os IDs são sequenciais, vamos limpar uma faixa ampla
    for (let i = 1; i < 10000; i++) {
      try {
        clearInterval(i);
        this.state.pausedIntervals.push(i);
      } catch (error) {
        // Ignorar erros - alguns IDs podem não existir
      }
    }
    console.log(`[Emergency BigQuery] 🧹 Limpou ${this.state.pausedIntervals.length} intervalos`);
  }

  /**
   * Limpar todos os timeouts ativos
   */
  private static clearAllTimeouts(): void {
    // Método agressivo para limpar timeouts
    for (let i = 1; i < 10000; i++) {
      try {
        clearTimeout(i);
        this.state.pausedTimeouts.push(i);
      } catch (error) {
        // Ignorar erros
      }
    }
    console.log(`[Emergency BigQuery] 🧹 Limpou ${this.state.pausedTimeouts.length} timeouts`);
  }

  /**
   * Desativar polling automático
   */
  private static disableAutoPolling(): void {
    // Sobrescrever setInterval temporariamente
    const originalSetInterval = window.setInterval;
    
    (window as any).setInterval = (...args: any[]) => {
      console.warn('[Emergency BigQuery] ⛔ setInterval bloqueado durante emergência');
      return 0; // Retornar ID inválido
    };

    // Restaurar após 5 minutos
    setTimeout(() => {
      window.setInterval = originalSetInterval;
      console.log('[Emergency BigQuery] 🔄 setInterval restaurado');
    }, 5 * 60 * 1000);
  }

  /**
   * Notificar componentes sobre mudança de estado
   */
  private static notifyComponents(action: 'emergency-pause' | 'emergency-resume'): void {
    window.dispatchEvent(new CustomEvent('bigquery-emergency', {
      detail: { 
        action,
        isEmergencyMode: this.state.isEmergencyMode,
        timestamp: Date.now()
      }
    }));
  }

  /**
   * Mostrar notificação de emergência
   */
  private static showEmergencyNotification(): void {
    // Criar notificação visual de emergência
    const notification = document.createElement('div');
    notification.id = 'bigquery-emergency-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        padding: 15px;
        border-radius: 8px;
        z-index: 9999;
        font-family: Arial, sans-serif;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        max-width: 300px;
      ">
        <h4 style="margin: 0 0 10px 0;">🚨 MODO DE EMERGÊNCIA ATIVO</h4>
        <p style="margin: 0; font-size: 14px;">
          Todos os processos foram pausados para resolver o problema de quota excedida no BigQuery.
        </p>
        <button onclick="document.getElementById('bigquery-emergency-notification').remove()" 
                style="margin-top: 10px; padding: 5px 10px; background: white; color: #ff4444; border: none; border-radius: 4px; cursor: pointer;">
          OK
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);

    // Remover automaticamente após 30 segundos
    setTimeout(() => {
      const element = document.getElementById('bigquery-emergency-notification');
      if (element) element.remove();
    }, 30000);
  }

  /**
   * Verificar se está em modo de emergência
   */
  static isEmergencyMode(): boolean {
    return this.state.isEmergencyMode;
  }

  /**
   * Status do modo de emergência
   */
  static getEmergencyStatus(): EmergencyState {
    return { ...this.state };
  }

  /**
   * Função de monitoramento seguro (apenas log, sem consultas)
   */
  static safeMonitoring(): void {
    if (this.state.isEmergencyMode) {
      console.log(`[Emergency BigQuery] 💚 Modo de emergência ativo há ${Math.round((Date.now() - this.state.startTime) / 1000 / 60)} minutos`);
    } else {
      console.log('[Emergency BigQuery] ✅ Sistema operando normalmente');
    }
  }
}

/**
 * EXECUTAR CORREÇÃO DE EMERGÊNCIA IMEDIATAMENTE
 */
export const executeEmergencyBigQueryFix = () => {
  console.log('[Emergency BigQuery] 🚨 EXECUTANDO CORREÇÃO DE EMERGÊNCIA');
  EmergencyBigQueryFix.activateEmergencyMode();
  
  // Agendar desativação automática após 10 minutos
  setTimeout(() => {
    console.log('[Emergency BigQuery] ⏰ Desativando modo de emergência automaticamente');
    EmergencyBigQueryFix.deactivateEmergencyMode();
  }, 10 * 60 * 1000);
};

/**
 * Hook para usar correção de emergência
 */
export const useEmergencyBigQueryFix = () => {
  return {
    activateEmergency: EmergencyBigQueryFix.activateEmergencyMode,
    deactivateEmergency: EmergencyBigQueryFix.deactivateEmergencyMode,
    isEmergencyMode: EmergencyBigQueryFix.isEmergencyMode,
    getStatus: EmergencyBigQueryFix.getEmergencyStatus,
    executeNow: executeEmergencyBigQueryFix
  };
};

// EXECUTAR AUTOMATICAMENTE AO IMPORTAR ESTE ARQUIVO
console.log('[Emergency BigQuery] 📦 Módulo de emergência carregado');

// Disponibilizar globalmente para debug
(window as any).emergencyBigQueryFix = EmergencyBigQueryFix;

export default EmergencyBigQueryFix; 