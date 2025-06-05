
import { corsHeaders } from './config.ts';

export function buildSuccessResponse(qrCode: string, instanceName: string, cached = false, status = 'waiting_scan') {
  return new Response(
    JSON.stringify({
      success: true,
      qrCode: qrCode,
      cached: cached,
      instanceName: instanceName,
      status: status,
      message: cached ? 'QR Code obtido do cache' : 'QR Code obtido da VPS com sucesso'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

export function buildWaitingResponse(instanceName: string, retryAfter = 10000, message = 'QR Code ainda sendo gerado') {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'QR Code ainda não disponível',
      waiting: true,
      instanceName: instanceName,
      retryAfter: retryAfter,
      message: message
    }),
    { 
      status: 202, // Accepted - processing
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

export function buildErrorResponse(error: any, instanceId: string) {
  console.error('[QR Response] 💥 ERRO GERAL CAPTURADO:', error);
  console.error('[QR Response] Stack trace:', error.stack);
  
  let statusCode = 500;
  if (error.message.includes('não encontrado')) {
    statusCode = 404;
  } else if (error.message.includes('não tem acesso') || error.message.includes('inválido')) {
    statusCode = 403;
  } else if (error.message.includes('obrigatório')) {
    statusCode = 400;
  }
  
  return new Response(
    JSON.stringify({
      success: false,
      error: error.message,
      action: 'qr_code_async_error_handling',
      timestamp: new Date().toISOString(),
      instanceId: instanceId,
      details: {
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 5)
      }
    }),
    { 
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}
