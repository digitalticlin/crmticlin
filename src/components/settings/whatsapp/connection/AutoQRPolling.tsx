
import { AggressiveQRPolling } from "@/services/whatsapp/aggressiveQRPolling";

export class AutoQRPolling {
  private aggressivePolling: AggressiveQRPolling;

  constructor(
    instanceId: string,
    instanceName: string,
    refreshQRCode: (instanceId: string) => Promise<any>,
    onSuccess: (qrCode: string) => void
  ) {
    console.log('[Auto QR Polling] 🔄 Inicializando com polling agressivo...');
    
    this.aggressivePolling = new AggressiveQRPolling(
      instanceId,
      instanceName,
      refreshQRCode,
      onSuccess,
      () => {
        console.log('[Auto QR Polling] ⏰ Timeout do polling agressivo');
      }
    );
  }

  start(delayMs: number = 0) {
    if (delayMs > 0) {
      console.log(`[Auto QR Polling] ⏳ Aguardando ${delayMs}ms antes de iniciar...`);
      setTimeout(() => {
        this.aggressivePolling.start();
      }, delayMs);
    } else {
      console.log('[Auto QR Polling] 🚀 Iniciando imediatamente...');
      this.aggressivePolling.start();
    }
  }

  stop() {
    console.log('[Auto QR Polling] 🛑 Parando polling...');
    this.aggressivePolling.stop();
  }
}
