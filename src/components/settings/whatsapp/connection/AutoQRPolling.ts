
import { toast } from "sonner";

export class AutoQRPolling {
  private intervalId: NodeJS.Timeout | null = null;
  private attempts = 0;
  private readonly maxAttempts = 6;
  private isActive = false;
  private isConnected = false;

  constructor(
    private instanceId: string,
    private instanceName: string,
    private refreshQRCode: (instanceId: string) => Promise<{ qrCode?: string; success?: boolean; waiting?: boolean; connected?: boolean } | null>,
    private onSuccess: (qrCode: string) => void,
    private onConnected?: () => void
  ) {}

  async start(delay = 0) {
    if (this.isActive) {
      console.log('[Auto QR] ⚠️ Polling já ativo - ignorando nova chamada');
      return;
    }

    if (this.isConnected) {
      console.log('[Auto QR] ⚠️ Instância já conectada - não iniciando polling');
      return;
    }

    console.log('[Auto QR] 🚀 Iniciando polling controlado v4.0 para:', this.instanceName);
    
    setTimeout(() => {
      this.startPolling();
    }, delay);
  }

  private startPolling() {
    if (this.isActive || this.isConnected) return;
    
    this.isActive = true;
    this.attempts = 0;

    this.intervalId = setInterval(async () => {
      this.attempts++;
      console.log(`[Auto QR] 📡 Tentativa ${this.attempts}/${this.maxAttempts} para ${this.instanceName}`);
      
      try {
        const result = await this.refreshQRCode(this.instanceId);
        
        // NOVO: Verificar se conectou
        if (result?.connected) {
          console.log('[Auto QR] ✅ Instância conectada! Parando polling');
          this.isConnected = true;
          this.stop();
          if (this.onConnected) {
            this.onConnected();
          }
          toast.success(`"${this.instanceName}" conectado com sucesso!`);
          return;
        }
        
        if (result?.success && result.qrCode) {
          console.log('[Auto QR] ✅ QR Code obtido automaticamente!');
          this.onSuccess(result.qrCode);
          this.stop();
          toast.success(`QR Code pronto para "${this.instanceName}"!`);
          return;
        }
        
        if (result?.waiting) {
          console.log('[Auto QR] ⏳ QR Code ainda sendo gerado...');
        }
        
        if (this.attempts >= this.maxAttempts) {
          console.log('[Auto QR] ⏰ Timeout do polling');
          this.stop();
          toast.info(`QR Code não gerado automaticamente. Use o botão "Gerar QR Code" manualmente.`);
        }
        
      } catch (error: any) {
        console.error('[Auto QR] ❌ Erro no polling:', error);
        if (this.attempts >= this.maxAttempts) {
          this.stop();
          toast.error(`Erro no polling: ${error.message}`);
        }
      }
    }, 5000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isActive = false;
    this.attempts = 0;
    console.log('[Auto QR] 🛑 Polling parado');
  }

  // NOVO: Método para marcar como conectado externamente
  markAsConnected() {
    this.isConnected = true;
    this.stop();
  }

  // NOVO: Método para verificar se está conectado
  getConnectionStatus() {
    return this.isConnected;
  }
}
