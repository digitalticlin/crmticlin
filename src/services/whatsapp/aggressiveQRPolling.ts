
import { toast } from "sonner";

export class AggressiveQRPolling {
  private intervalId: NodeJS.Timeout | null = null;
  private attempts = 0;
  private readonly maxAttempts = 15; // 30 segundos / 2 segundos = 15 tentativas
  private readonly intervalMs = 2000; // 2 segundos

  constructor(
    private instanceId: string,
    private instanceName: string,
    private refreshQRCode: (instanceId: string) => Promise<any>,
    private onSuccess: (qrCode: string) => void,
    private onTimeout?: () => void
  ) {}

  start() {
    console.log(`[Aggressive Polling] 🚀 Iniciando polling agressivo para: ${this.instanceName}`);
    console.log(`[Aggressive Polling] ⏱️ Configuração: ${this.intervalMs}ms x ${this.maxAttempts} tentativas`);
    
    this.attempts = 0;
    this.poll();
    
    this.intervalId = setInterval(() => {
      this.poll();
    }, this.intervalMs);
  }

  private async poll() {
    this.attempts++;
    console.log(`[Aggressive Polling] 🔄 Tentativa ${this.attempts}/${this.maxAttempts} para ${this.instanceName}`);

    try {
      const result = await this.refreshQRCode(this.instanceId);
      
      if (result?.success && result.qrCode) {
        console.log(`[Aggressive Polling] ✅ QR Code obtido na tentativa ${this.attempts}`);
        this.stop();
        this.onSuccess(result.qrCode);
        toast.success(`QR Code obtido após ${this.attempts} tentativas!`);
        return;
      }

      console.log(`[Aggressive Polling] ⏳ Tentativa ${this.attempts}: QR Code ainda não disponível`);

      if (this.attempts >= this.maxAttempts) {
        console.warn(`[Aggressive Polling] ⏰ Timeout após ${this.maxAttempts} tentativas`);
        this.stop();
        toast.warning(`Timeout: QR Code não obtido após ${this.maxAttempts} tentativas em ${(this.maxAttempts * this.intervalMs) / 1000}s`);
        
        if (this.onTimeout) {
          this.onTimeout();
        }
      }

    } catch (error) {
      console.error(`[Aggressive Polling] ❌ Erro na tentativa ${this.attempts}:`, error);
      
      if (this.attempts >= this.maxAttempts) {
        this.stop();
        toast.error(`Erro após ${this.maxAttempts} tentativas: ${error.message}`);
      }
    }
  }

  stop() {
    if (this.intervalId) {
      console.log(`[Aggressive Polling] 🛑 Parando polling para ${this.instanceName}`);
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getProgress() {
    return {
      current: this.attempts,
      max: this.maxAttempts,
      percentage: Math.round((this.attempts / this.maxAttempts) * 100)
    };
  }
}
