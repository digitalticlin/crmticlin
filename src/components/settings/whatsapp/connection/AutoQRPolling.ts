
import { toast } from "sonner";

export class AutoQRPolling {
  private intervalId: NodeJS.Timeout | null = null;
  private attempts = 0;
  private readonly maxAttempts = 20; // 60 segundos (3s * 20)

  constructor(
    private instanceId: string,
    private instanceName: string,
    private refreshQRCode: (instanceId: string) => Promise<{ qrCode?: string; success?: boolean; waiting?: boolean } | null>,
    private onSuccess: (qrCode: string) => void
  ) {}

  async start(delay = 0) {
    console.log('[Auto QR] 🚀 FLUXO AUTOMÁTICO: Iniciando polling IMEDIATO via whatsapp_qr_service para:', this.instanceName);
    
    // CORREÇÃO: Remover delay para fluxo automático imediato
    setTimeout(() => {
      this.startPolling();
    }, delay);
  }

  private startPolling() {
    this.intervalId = setInterval(async () => {
      this.attempts++;
      console.log(`[Auto QR] 📡 FLUXO AUTOMÁTICO: Tentativa ${this.attempts}/${this.maxAttempts} via whatsapp_qr_service para ${this.instanceName}`);
      
      try {
        const result = await this.refreshQRCode(this.instanceId);
        
        if (result?.success && result.qrCode) {
          console.log('[Auto QR] ✅ FLUXO AUTOMÁTICO: QR Code obtido automaticamente via whatsapp_qr_service!');
          this.onSuccess(result.qrCode);
          this.stop();
          toast.success(`QR Code pronto para "${this.instanceName}"! Escaneie para conectar.`);
          return;
        }
        
        if (result?.waiting) {
          console.log('[Auto QR] ⏳ FLUXO AUTOMÁTICO: QR Code ainda sendo gerado na VPS...');
        }
        
        if (this.attempts >= this.maxAttempts) {
          console.log('[Auto QR] ⏰ FLUXO AUTOMÁTICO: Timeout do polling automático');
          this.stop();
          toast.warning(`QR Code não gerado automaticamente para "${this.instanceName}". Tente gerar manualmente.`);
        }
        
      } catch (error: any) {
        console.error('[Auto QR] ❌ FLUXO AUTOMÁTICO: Erro no polling:', error);
        if (this.attempts >= this.maxAttempts) {
          this.stop();
          toast.error(`Erro no polling automático: ${error.message}`);
        }
      }
    }, 3000); // 3 segundos entre tentativas
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[Auto QR] 🛑 FLUXO AUTOMÁTICO: Polling automático parado');
    }
  }
}
