
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './config.ts';
import { checkServices } from './healthChecker.ts';
import { generateOptimizedDeployScript } from './deployScript.ts';
import { buildSuccessResponse, buildFailureResponse, buildErrorResponse } from './responseBuilder.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Verificando status dos serviços WhatsApp...');

    const VPS_HOST = '31.97.24.222';
    const API_SERVER_PORT = '80';
    const WHATSAPP_PORT = '3001';

    // === VERIFICAÇÃO OTIMIZADA COM RETRY ===
    console.log('📡 Testando conectividade dos serviços com retry automático...');
    
    const { apiResult, whatsappResult } = await checkServices(
      VPS_HOST, 
      API_SERVER_PORT, 
      WHATSAPP_PORT
    );

    // === AMBOS SERVIÇOS ONLINE - SUCESSO! ===
    if (apiResult.online && whatsappResult.online) {
      return buildSuccessResponse(
        VPS_HOST,
        API_SERVER_PORT,
        WHATSAPP_PORT,
        apiResult,
        whatsappResult
      );
    }

    // === UM OU AMBOS SERVIÇOS OFFLINE ===
    const optimizedDeployScript = generateOptimizedDeployScript();

    return buildFailureResponse(
      VPS_HOST,
      apiResult,
      whatsappResult,
      optimizedDeployScript
    );

  } catch (error) {
    return buildErrorResponse(error);
  }
});
