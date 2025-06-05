
import { supabase } from "@/integrations/supabase/client";

interface QRCodePollingHook {
  pollForQRCode: (instanceId: string, addLog: (message: string) => void, updateTestResult: (step: string, updates: any) => void) => Promise<void>;
}

export const useQRCodePolling = (setQrCodePolling: (polling: boolean) => void): QRCodePollingHook => {
  const pollForQRCode = async (
    instanceId: string, 
    addLog: (message: string) => void,
    updateTestResult: (step: string, updates: any) => void
  ) => {
    setQrCodePolling(true);
    addLog("🔄 PASSO 4B: Iniciando polling ROBUSTO para QR Code...");
    
    const maxAttempts = 8;
    const delayMs = 10000;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        addLog(`📱 Tentativa ${attempt}/${maxAttempts} para obter QR Code (delay: ${delayMs}ms)`);
        
        const { data: qrData, error: qrError } = await supabase.functions.invoke('whatsapp_web_server', {
          body: { 
            action: 'get_qr_code_async',
            instanceData: { 
              instanceId: instanceId
            }
          }
        });

        addLog(`📋 Resposta tentativa ${attempt}: ${JSON.stringify(qrData, null, 2)}`);

        if (qrError) {
          addLog(`❌ Erro Supabase na tentativa ${attempt}: ${JSON.stringify(qrError)}`);
          throw new Error(qrError.message);
        }

        if (qrData.success && qrData.qrCode) {
          addLog(`✅ QR Code obtido com sucesso na tentativa ${attempt}!`);
          updateTestResult('qr_code_polling', {
            success: true,
            duration: attempt * delayMs,
            details: { 
              attempts: attempt, 
              hasQrCode: true, 
              cached: qrData.cached,
              qrCodeLength: qrData.qrCode.length,
              instanceName: qrData.instanceName,
              message: qrData.message
            },
            timestamp: new Date().toISOString()
          });
          setQrCodePolling(false);
          return;
        } else if (qrData.waiting) {
          addLog(`⏳ QR Code ainda não disponível (tentativa ${attempt}) - ${qrData.message || 'Aguardando...'}`);
          
          if (attempt < maxAttempts) {
            const actualDelay = qrData.retryAfter || delayMs;
            addLog(`😴 Aguardando ${actualDelay/1000}s antes da próxima tentativa...`);
            await new Promise(resolve => setTimeout(resolve, actualDelay));
          }
        } else {
          const errorMsg = qrData.error || 'Falha ao obter QR Code';
          addLog(`❌ Erro na tentativa ${attempt}: ${errorMsg}`);
          
          if (!qrData.waiting && !errorMsg.includes('ainda não')) {
            throw new Error(errorMsg);
          }
          
          if (attempt < maxAttempts) {
            addLog(`😴 Aguardando ${delayMs/1000}s antes da próxima tentativa...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
        }

      } catch (error: any) {
        addLog(`❌ Erro na tentativa ${attempt}: ${error.message}`);
        
        if (attempt === maxAttempts) {
          updateTestResult('qr_code_polling', {
            success: false,
            duration: maxAttempts * delayMs,
            error: `QR Code não disponível após ${maxAttempts} tentativas: ${error.message}`,
            timestamp: new Date().toISOString()
          });
        } else {
          if (error.message.includes('timeout') || error.message.includes('network')) {
            addLog(`🔄 Erro de rede/timeout - aguardando antes de retry...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
        }
      }
    }
    
    setQrCodePolling(false);
    addLog("⏰ Polling finalizado - QR Code pode estar disponível posteriormente");
  };

  return { pollForQRCode };
};
