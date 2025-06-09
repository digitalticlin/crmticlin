
import { ImprovedQRService } from "@/services/whatsapp/improvedQRService";

export class AutoQRPolling {
  private instanceId: string;
  private isPolling: boolean = false;
  private pollingInterval: number | null = null;
  private maxAttempts: number;
  private currentAttempt: number = 0;
  private onQRCode: (qrCode: string) => void;
  private onError: (error: string) => void;
  private onProgress: (current: number, max: number) => void;
  private onTimeout: () => void;

  constructor(
    instanceId: string,
    maxAttempts: number = 8,
    onQRCode: (qrCode: string) => void,
    onError: (error: string) => void,
    onProgress: (current: number, max: number) => void,
    onTimeout: () => void
  ) {
    this.instanceId = instanceId;
    this.maxAttempts = maxAttempts;
    this.onQRCode = onQRCode;
    this.onError = onError;
    this.onProgress = onProgress;
    this.onTimeout = onTimeout;
  }

  async start(): Promise<void> {
    if (this.isPolling) {
      console.log('[Auto QR Polling] ⚠️ Polling já está ativo');
      return;
    }

    console.log(`[Auto QR Polling] 🚀 CORREÇÃO: Iniciando polling para VPS corrigida: ${this.instanceId}`);
    this.isPolling = true;
    this.currentAttempt = 0;

    // CORREÇÃO: Aguardar 4 segundos antes da primeira tentativa (VPS precisa processar)
    await new Promise(resolve => setTimeout(resolve, 4000));

    this.pollingInterval = window.setInterval(async () => {
      if (!this.isPolling) {
        this.stop('polling parado');
        return;
      }

      this.currentAttempt++;
      console.log(`[Auto QR Polling] 🔄 Tentativa ${this.currentAttempt}/${this.maxAttempts} para ${this.instanceId}`);
      
      this.onProgress(this.currentAttempt, this.maxAttempts);

      try {
        const result = await ImprovedQRService.getQRCodeWithDetails(this.instanceId);
        
        if (result.success && result.qrCode) {
          console.log(`[Auto QR Polling] ✅ QR Code obtido na tentativa ${this.currentAttempt}!`);
          this.onQRCode(result.qrCode);
          this.stop('QR Code obtido');
          return;
        }

        if (result.waiting) {
          console.log(`[Auto QR Polling] ⏳ Tentativa ${this.currentAttempt}: QR ainda sendo gerado`);
          // Continuar polling
          return;
        }

        if (result.error) {
          console.log(`[Auto QR Polling] ❌ Erro na tentativa ${this.currentAttempt}:`, result.error);
        }

      } catch (error: any) {
        console.error(`[Auto QR Polling] ❌ Erro na tentativa ${this.currentAttempt}:`, error);
      }

      if (this.currentAttempt >= this.maxAttempts) {
        console.log(`[Auto QR Polling] ⏰ Timeout após ${this.maxAttempts} tentativas`);
        this.onTimeout();
        this.stop('timeout');
      }
    }, 4000); // 4 segundos entre tentativas
  }

  stop(reason: string = 'manual'): void {
    console.log(`[Auto QR Polling] 🛑 Parando polling: ${reason}`);
    this.isPolling = false;
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  getCurrentAttempt(): number {
    return this.currentAttempt;
  }

  isActive(): boolean {
    return this.isPolling;
  }
}
