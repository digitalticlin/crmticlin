
import { toast } from "sonner";

export class AutoQRPolling {
  private intervalId: NodeJS.Timeout | null = null;
  private attempts = 0;
  private readonly maxAttempts = 6; // Reduzido para 6 tentativas
  private isActive = false;

  constructor(
    private instanceId: string,
    private instanceName: string,
    private refreshQRCode: (instanceId: string) => Promise<{ qrCode?: string; success?: boolean; waiting?: boolean } | null>,
    private onSuccess: (qrCode: string) => void
  ) {}

  async start(delay = 0) {
    if (this.isActive) {
      console.log('[Auto QR] ⚠️ Polling já ativo - ignorando nova chamada');
      return;
    }

    console.log('[Auto QR] 🚀 Iniciando polling otimizado v3.0 para:', this.instanceName);
    
    setTimeout(() => {
      this.startPolling();
    }, delay);
  }

  private startPolling() {
    if (this.isActive) return;
    
    this.isActive = true;
    this.attempts = 0;

    this.intervalId = setInterval(async () => {
      this.attempts++;
      console.log(`[Auto QR] 📡 Tentativa ${this.attempts}/${this.maxAttempts} para ${this.instanceName}`);
      
      try {
        const result = await this.refreshQRCode(this.instanceId);
        
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
    }, 5000); // 5 segundos entre tentativas - menos agressivo
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
}
