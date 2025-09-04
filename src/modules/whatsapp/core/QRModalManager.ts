import { toast } from 'sonner';

/**
 * Singleton Manager para controlar que apenas 1 modal QR esteja aberto por vez
 * Substitui o Provider global por uma solução mais performática
 */
class QRModalManager {
  private static instance: QRModalManager;
  private activeInstanceId: string | null = null;
  private activeInstanceName: string | null = null;

  private constructor() {
    // Private constructor para singleton
    console.log('[QRModalManager] 🏗️ Singleton criado');
  }

  static getInstance(): QRModalManager {
    if (!QRModalManager.instance) {
      QRModalManager.instance = new QRModalManager();
    }
    return QRModalManager.instance;
  }

  /**
   * Verifica se pode abrir modal para instância específica
   */
  canOpenModal(instanceId: string): boolean {
    // Se não há modal ativo, pode abrir
    if (!this.activeInstanceId) {
      return true;
    }
    
    // Se é a mesma instância, pode reabrir
    if (this.activeInstanceId === instanceId) {
      return true;
    }
    
    // Há outro modal ativo
    console.warn('[QRModalManager] ⚠️ Modal já ativo para:', {
      active: this.activeInstanceId,
      requested: instanceId
    });
    
    return false;
  }

  /**
   * Abre modal para instância específica
   */
  openModal(instanceId: string, instanceName?: string): boolean {
    // ✅ FORÇA LIMPEZA SE NECESSÁRIO - para resolver problema de modal não abrindo
    if (this.activeInstanceId && this.activeInstanceId !== instanceId) {
      console.log('[QRModalManager] 🔄 Forçando fechamento de modal anterior:', {
        previous: this.activeInstanceId,
        new: instanceId
      });
      this.forceCloseAll();
    }

    if (!this.canOpenModal(instanceId)) {
      toast.error('Feche o modal atual antes de abrir outro', {
        description: `Modal ativo: ${this.activeInstanceName || 'Instância desconhecida'}`
      });
      return false;
    }

    console.log('[QRModalManager] 📱 Abrindo modal para:', { instanceId, instanceName });
    
    this.activeInstanceId = instanceId;
    this.activeInstanceName = instanceName || null;
    
    return true;
  }

  /**
   * Fecha modal atual
   */
  closeModal(instanceId?: string): void {
    // Se especificou ID, só fecha se for o modal ativo
    if (instanceId && this.activeInstanceId !== instanceId) {
      console.warn('[QRModalManager] ⚠️ Tentativa de fechar modal não ativo:', {
        active: this.activeInstanceId,
        requested: instanceId
      });
      return;
    }

    console.log('[QRModalManager] 🚪 Fechando modal:', this.activeInstanceId);
    
    this.activeInstanceId = null;
    this.activeInstanceName = null;
  }

  /**
   * Info sobre modal ativo
   */
  getActiveModal(): { instanceId: string | null; instanceName: string | null } {
    return {
      instanceId: this.activeInstanceId,
      instanceName: this.activeInstanceName
    };
  }

  /**
   * Força fechamento de qualquer modal ativo
   */
  forceCloseAll(): void {
    console.log('[QRModalManager] 🔥 Força fechamento de todos os modais');
    this.activeInstanceId = null;
    this.activeInstanceName = null;
  }

  /**
   * Debug info
   */
  getDebugInfo(): object {
    return {
      hasActiveModal: !!this.activeInstanceId,
      activeInstanceId: this.activeInstanceId,
      activeInstanceName: this.activeInstanceName,
      timestamp: new Date().toISOString()
    };
  }
}

export default QRModalManager;

// Export conveniência
export const qrModalManager = QRModalManager.getInstance();