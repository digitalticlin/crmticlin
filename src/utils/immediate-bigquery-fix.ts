/**
 * CORREÇÃO INTELIGENTE PARA BIGQUERY
 * 
 * Sistema que monitora e para processos APENAS quando quota é excedida
 * Não interfere na operação normal do sistema
 */

class IntelligentBigQueryFix {
  private static isEmergencyMode = false;
  private static originalSetInterval: typeof setInterval;
  private static originalConsoleLog: typeof console.log;
  private static logCounter = 0;
  
  /**
   * ATIVAR APENAS EM EMERGÊNCIA REAL
   */
  static activateEmergencyMode(): void {
    if (this.isEmergencyMode) return;
    this.isEmergencyMode = true;

    console.log('🚨 MODO EMERGÊNCIA BIGQUERY ATIVADO - Reduzindo atividade temporariamente');

    // Preservar funções originais para restaurar
    this.originalSetInterval = window.setInterval;
    this.originalConsoleLog = console.log;

    // Reduzir logs (não eliminar completamente)
    console.log = (...args: any[]) => {
      this.logCounter++;
      if (this.logCounter % 50 === 0) {
        this.originalConsoleLog(`🔇 ${this.logCounter} logs condensados para reduzir carga BigQuery`);
      }
      // Manter logs críticos
      if (args.some(arg => typeof arg === 'string' && (arg.includes('❌') || arg.includes('ERROR') || arg.includes('CRITICAL')))) {
        this.originalConsoleLog(...args);
      }
    };

    // Emitir evento para componentes reduzirem atividade
    window.dispatchEvent(new CustomEvent('bigquery-emergency-reduce', {
      detail: { 
        action: 'reduce-activity',
        reason: 'quota-exceeded',
        timestamp: Date.now()
      }
    }));

    this.showEmergencyNotification();

    // Auto-desativar após 15 minutos
    setTimeout(() => {
      this.deactivateEmergencyMode();
    }, 15 * 60 * 1000);
  }

  /**
   * DESATIVAR MODO EMERGÊNCIA
   */
  static deactivateEmergencyMode(): void {
    if (!this.isEmergencyMode) return;
    
    console.log('✅ MODO EMERGÊNCIA BIGQUERY DESATIVADO - Restaurando operação normal');
    
    // Restaurar funções originais
    if (this.originalConsoleLog) {
      console.log = this.originalConsoleLog;
    }
    
    this.isEmergencyMode = false;
    
    // Emitir evento para restaurar atividade normal
    window.dispatchEvent(new CustomEvent('bigquery-emergency-restore', {
      detail: { 
        action: 'restore-normal-activity',
        timestamp: Date.now()
      }
    }));

    this.hideEmergencyNotification();
  }

  /**
   * VERIFICAR SE DEVE ATIVAR EMERGÊNCIA
   */
  static checkQuotaAndActivateIfNeeded(): void {
    // Ativar apenas se detectar erro 403 BigQuery
    // Esta função será chamada apenas quando há erro real
    if (!this.isEmergencyMode) {
      this.activateEmergencyMode();
    }
  }

  /**
   * Mostrar notificação de emergência (menos intrusiva)
   */
  private static showEmergencyNotification(): void {
    const existingNotification = document.getElementById('bigquery-emergency-notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.id = 'bigquery-emergency-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #ff6b6b, #ee5a24);
        color: white;
        padding: 12px 20px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        z-index: 10000;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        max-width: 350px;
        animation: slideInRight 0.3s ease-out;
      ">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="font-size: 18px;">⚡</div>
          <div>
            <div style="font-weight: 600; margin-bottom: 4px;">Modo Economia BigQuery</div>
            <div style="font-size: 12px; opacity: 0.9;">
              Reduzindo atividade temporariamente para normalizar quota
            </div>
          </div>
        </div>
      </div>
      <style>
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      </style>
    `;
    
    document.body.appendChild(notification);
  }

  /**
   * Remover notificação
   */
  private static hideEmergencyNotification(): void {
    const notification = document.getElementById('bigquery-emergency-notification');
    if (notification) {
      notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
      setTimeout(() => notification.remove(), 300);
    }
  }

  /**
   * INTERFACE PÚBLICA SIMPLIFICADA
   */
  static isEmergencyActive(): boolean {
    return this.isEmergencyMode;
  }

  static handleBigQueryError(error: any): void {
    if (error?.message?.includes('quota') || error?.message?.includes('exceeded') || error?.code === 403) {
      this.checkQuotaAndActivateIfNeeded();
    }
  }
}

// CSS para animações
const style = document.createElement('style');
style.textContent = `
  @keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Exportar apenas a interface necessária
export const BigQueryOptimizer = {
  activateEmergency: () => IntelligentBigQueryFix.activateEmergencyMode(),
  deactivateEmergency: () => IntelligentBigQueryFix.deactivateEmergencyMode(),
  isEmergencyActive: () => IntelligentBigQueryFix.isEmergencyActive(),
  handleError: (error: any) => IntelligentBigQueryFix.handleBigQueryError(error)
};

// NÃO EXECUTAR AUTOMATICAMENTE - apenas exportar para uso sob demanda
console.log('✅ BigQuery Optimizer carregado (modo inteligente - ativa apenas se necessário)'); 