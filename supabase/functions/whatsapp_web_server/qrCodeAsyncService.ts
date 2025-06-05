
import { validateQRCodeParams, validateInstanceAccess } from './qrCodeValidationService.ts';
import { fetchQRCodeFromVPS } from './qrCodeVPSService.ts';
import { checkCachedQRCode, updateQRCodeInDatabase } from './qrCodeDatabaseService.ts';
import { buildSuccessResponse, buildWaitingResponse, buildErrorResponse } from './qrCodeResponseBuilder.ts';

export async function getQRCodeAsync(supabase: any, instanceId: string, userId: string) {
  console.log(`[QR Async] 📱 INICIANDO obtenção QR Code ROBUSTA para instância: ${instanceId}`);
  console.log(`[QR Async] 👤 Usuário: ${userId}`);
  
  try {
    // PASSO 1: VALIDAÇÃO ROBUSTA DE PARÂMETROS
    await validateQRCodeParams(instanceId, userId);

    // PASSO 2: BUSCAR INSTÂNCIA E VALIDAR ACESSO
    const instance = await validateInstanceAccess(supabase, instanceId, userId);

    // PASSO 3: VERIFICAR QR CODE EXISTENTE (CACHE)
    const cachedResult = await checkCachedQRCode(instance);
    if (cachedResult) {
      return buildSuccessResponse(cachedResult.qrCode, cachedResult.instanceName, true);
    }

    // PASSO 4: VALIDAR VPS INSTANCE ID
    if (!instance.vps_instance_id) {
      console.error('[QR Async] ❌ VPS Instance ID não encontrado para:', instanceId);
      throw new Error('VPS Instance ID não configurado para esta instância');
    }

    console.log(`[QR Async] ✅ VPS Instance ID válido: ${instance.vps_instance_id}`);

    // PASSO 5: BUSCAR QR CODE NA VPS
    const vpsResult = await fetchQRCodeFromVPS(instance.vps_instance_id);
    
    if (vpsResult.success && vpsResult.qrCode) {
      // PASSO 6: ATUALIZAR QR CODE NO BANCO
      await updateQRCodeInDatabase(supabase, instanceId, vpsResult.qrCode);
      
      return buildSuccessResponse(
        vpsResult.qrCode, 
        instance.instance_name, 
        false, 
        vpsResult.status
      );
    } else {
      return buildWaitingResponse(
        instance.instance_name,
        vpsResult.retryAfter,
        vpsResult.message
      );
    }

  } catch (error: any) {
    return buildErrorResponse(error, instanceId);
  }
}
