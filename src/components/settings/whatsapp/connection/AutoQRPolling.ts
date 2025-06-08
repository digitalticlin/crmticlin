
import { toast } from "sonner";

export class AutoQRPolling {
  private intervalId: NodeJS.Timeout | null = null;
  private attempts = 0;
  private readonly maxAttempts = 30; // 90 segundos (3s * 30)

  constructor(
    private instanceId: string,
    private instanceName: string,
    private refreshQRCode: (instanceId: string) => Promise<{ qrCode?: string } | null>,
    private onSuccess: (qrCode: string) => void
  ) {}

  async start(delay = 8000) {
    console.log('[Auto QR] 🚀 Iniciando polling automático para:', this.instanceName);
    
    setTimeout(() => {
      this.startPolling();
    }, delay);
  }

  private startPolling() {
    this.intervalId = setInterval(async () => {
      this.attempts++;
      console.log(`[Auto QR] 📡 Tentativa ${this.attempts}/${this.maxAttempts} para ${this.instanceName}`);
      
      try {
        const result = await this.refreshQRCode(this.instanceId);
        
        if (result?.qrCode) {
          console.log('[Auto QR] ✅ QR Code obtido automaticamente!');
          this.onSuccess(result.qrCode);
          this.stop();
          toast.success(`QR Code pronto para "${this.instanceName}"! Escaneie para conectar.`);
          return;
        }
        
        if (this.attempts >= this.maxAttempts) {
          console.log('[Auto QR] ⏰ Timeout do polling automático');
          this.stop();
          toast.warning(`QR Code não gerado automaticamente para "${this.instanceName}". Tente gerar manualmente.`);
        }
        
      } catch (error: any) {
        console.error('[Auto QR] ❌ Erro no polling:', error);
        if (this.attempts >= this.maxAttempts) {
          this.stop();
          toast.error(`Erro no polling automático: ${error.message}`);
        }
      }
    }, 3000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
