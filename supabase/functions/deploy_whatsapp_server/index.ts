
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
    console.log('🚀 INICIANDO DEPLOY PASSO A PASSO - VERIFICAÇÃO DETALHADA');

    const VPS_HOST = '31.97.24.222';
    const API_SERVER_PORT = '80';
    const WHATSAPP_PORT = '3001';

    // === PASSO 1: VERIFICAR API SERVER (PORTA 80) ===
    console.log('📋 PASSO 1: Verificando API Server na porta 80...');
    
    try {
      const apiController = new AbortController();
      const apiTimeout = setTimeout(() => apiController.abort(), 10000);
      
      const apiResponse = await fetch(`http://${VPS_HOST}:${API_SERVER_PORT}/status`, {
        method: 'GET',
        signal: apiController.signal,
        headers: {
          'User-Agent': 'Deploy-Test/1.0',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      clearTimeout(apiTimeout);
      
      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        console.log('✅ PASSO 1 OK: API Server respondendo:', apiData);
      } else {
        console.log(`⚠️ PASSO 1 FALHOU: API Server retornou status ${apiResponse.status}`);
        throw new Error(`API Server HTTP ${apiResponse.status}`);
      }
    } catch (apiError) {
      console.log('❌ PASSO 1 ERRO CRÍTICO:', apiError.message);
      return buildErrorResponse(new Error(`Passo 1 falhou - API Server: ${apiError.message}`));
    }

    // === PASSO 2: VERIFICAR WHATSAPP SERVER (PORTA 3001) ===
    console.log('📋 PASSO 2: Verificando WhatsApp Server na porta 3001...');
    
    try {
      const whatsappController = new AbortController();
      const whatsappTimeout = setTimeout(() => whatsappController.abort(), 10000);
      
      const whatsappResponse = await fetch(`http://${VPS_HOST}:${WHATSAPP_PORT}/health`, {
        method: 'GET',
        signal: whatsappController.signal,
        headers: {
          'User-Agent': 'Deploy-Test/1.0',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      clearTimeout(whatsappTimeout);
      
      if (whatsappResponse.ok) {
        const whatsappData = await whatsappResponse.json();
        console.log('✅ PASSO 2 OK: WhatsApp Server respondendo:', whatsappData);
      } else {
        console.log(`⚠️ PASSO 2 FALHOU: WhatsApp Server retornou status ${whatsappResponse.status}`);
        console.log('🔍 ESTE É O PONTO DE FALHA! WhatsApp Server não está respondendo na porta 3001');
        
        // Continuar para verificar se ambos falharam ou só o WhatsApp
      }
    } catch (whatsappError) {
      console.log('❌ PASSO 2 ERRO CRÍTICO:', whatsappError.message);
      console.log('🎯 ERRO IDENTIFICADO: WhatsApp Server não está acessível na porta 3001');
      console.log('💡 CAUSA PROVÁVEL: Servidor WhatsApp não está rodando ou não tem endpoint /health');
    }

    // === PASSO 3: USAR VERIFICAÇÃO ORIGINAL COM RETRY ===
    console.log('📋 PASSO 3: Executando verificação original com retry...');
    
    const { apiResult, whatsappResult } = await checkServices(
      VPS_HOST, 
      API_SERVER_PORT, 
      WHATSAPP_PORT
    );

    console.log('📊 RESULTADOS FINAIS:');
    console.log(`   API Server: ${apiResult.online ? '✅ ONLINE' : '❌ OFFLINE'}`);
    console.log(`   WhatsApp Server: ${whatsappResult.online ? '✅ ONLINE' : '❌ OFFLINE'}`);

    // === ANÁLISE DE DIAGNÓSTICO ===
    if (apiResult.online && whatsappResult.online) {
      console.log('🎉 DIAGNÓSTICO: Ambos serviços estão funcionando! Deploy não necessário.');
      return buildSuccessResponse(
        VPS_HOST,
        API_SERVER_PORT,
        WHATSAPP_PORT,
        apiResult,
        whatsappResult
      );
    }

    if (apiResult.online && !whatsappResult.online) {
      console.log('🔍 DIAGNÓSTICO: API Server OK, mas WhatsApp Server OFFLINE');
      console.log('💭 POSSÍVEIS CAUSAS:');
      console.log('   1. WhatsApp Server não está rodando (PM2 parado)');
      console.log('   2. Porta 3001 não está escutando');
      console.log('   3. Endpoint /health não existe no WhatsApp Server');
      console.log('   4. Processo do WhatsApp com erro');
    }

    if (!apiResult.online && whatsappResult.online) {
      console.log('🔍 DIAGNÓSTICO: WhatsApp Server OK, mas API Server OFFLINE');
      console.log('💭 Isso é estranho, pois acabamos de verificar que API está OK...');
    }

    if (!apiResult.online && !whatsappResult.online) {
      console.log('🔍 DIAGNÓSTICO: Ambos serviços OFFLINE');
      console.log('💭 POSSÍVEIS CAUSAS:');
      console.log('   1. Problema de conectividade geral');
      console.log('   2. Firewall bloqueando');
      console.log('   3. Ambos processos parados');
    }

    // === RETORNAR INSTRUÇÕES ESPECÍFICAS ===
    const optimizedDeployScript = generateOptimizedDeployScript();

    return buildFailureResponse(
      VPS_HOST,
      apiResult,
      whatsappResult,
      optimizedDeployScript
    );

  } catch (error) {
    console.log('❌ ERRO GERAL NO DEPLOY:', error.message);
    return buildErrorResponse(error);
  }
});
