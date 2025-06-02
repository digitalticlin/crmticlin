
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
    console.log('🚀 INICIANDO DEPLOY OTIMIZADO - VERIFICAÇÃO INTELIGENTE');

    const VPS_HOST = '31.97.24.222';
    const API_SERVER_PORT = '80';
    const WHATSAPP_PORT = '3001';

    // === VERIFICAÇÃO INTELIGENTE COM ENDPOINTS ALTERNATIVOS ===
    console.log('📋 Verificando API Server com endpoints múltiplos...');
    
    let apiOnline = false;
    let apiData = null;
    
    // Testar múltiplos endpoints para API
    const apiEndpoints = ['/health', '/status', '/'];
    
    for (const endpoint of apiEndpoints) {
      try {
        console.log(`🔍 Testando API: http://${VPS_HOST}:${API_SERVER_PORT}${endpoint}`);
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(`http://${VPS_HOST}:${API_SERVER_PORT}${endpoint}`, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Deploy-Checker/3.0',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        clearTimeout(timeout);
        
        if (response.ok) {
          try {
            apiData = await response.json();
          } catch (e) {
            apiData = { status: 'online', endpoint };
          }
          console.log(`✅ API Server respondeu em ${endpoint}:`, apiData);
          apiOnline = true;
          break;
        }
      } catch (error) {
        console.log(`❌ Endpoint ${endpoint} falhou:`, error.message);
      }
    }

    // === VERIFICAÇÃO INTELIGENTE WHATSAPP SERVER ===
    console.log('📋 Verificando WhatsApp Server com endpoints múltiplos...');
    
    let whatsappOnline = false;
    let whatsappData = null;
    
    // Testar múltiplos endpoints para WhatsApp
    const whatsappEndpoints = ['/health', '/status', '/', '/instances'];
    
    for (const endpoint of whatsappEndpoints) {
      try {
        console.log(`🔍 Testando WhatsApp: http://${VPS_HOST}:${WHATSAPP_PORT}${endpoint}`);
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(`http://${VPS_HOST}:${WHATSAPP_PORT}${endpoint}`, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Deploy-Checker/3.0',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        clearTimeout(timeout);
        
        if (response.ok) {
          try {
            whatsappData = await response.json();
          } catch (e) {
            whatsappData = { status: 'online', endpoint };
          }
          console.log(`✅ WhatsApp Server respondeu em ${endpoint}:`, whatsappData);
          whatsappOnline = true;
          break;
        }
      } catch (error) {
        console.log(`❌ WhatsApp endpoint ${endpoint} falhou:`, error.message);
      }
    }

    // === DIAGNÓSTICO DETALHADO ===
    console.log('📊 DIAGNÓSTICO DETALHADO:');
    console.log(`   API Server: ${apiOnline ? '✅ ONLINE' : '❌ OFFLINE'}`);
    console.log(`   WhatsApp Server: ${whatsappOnline ? '✅ ONLINE' : '❌ OFFLINE'}`);

    if (apiOnline && whatsappOnline) {
      console.log('🎉 AMBOS SERVIÇOS ONLINE - Deploy não necessário!');
      return buildSuccessResponse(
        VPS_HOST,
        API_SERVER_PORT,
        WHATSAPP_PORT,
        { online: true, data: apiData, attempt: 1 },
        { online: true, data: whatsappData, attempt: 1 }
      );
    }

    if (apiOnline && !whatsappOnline) {
      console.log('🔍 PROBLEMA IDENTIFICADO: WhatsApp Server OFFLINE');
      console.log('💡 SOLUÇÕES POSSÍVEIS:');
      console.log('   1. Servidor WhatsApp não foi iniciado');
      console.log('   2. Porta 3001 não está sendo usada');
      console.log('   3. Endpoint /health não implementado');
      console.log('   4. Servidor WhatsApp em outra porta');
    }

    if (!apiOnline && whatsappOnline) {
      console.log('🔍 PROBLEMA IDENTIFICADO: API Server OFFLINE');
      console.log('💡 POSSÍVEL CAUSA: Problema de conectividade ou firewall');
    }

    if (!apiOnline && !whatsappOnline) {
      console.log('🔍 PROBLEMA IDENTIFICADO: Ambos serviços OFFLINE');
      console.log('💡 POSSÍVEL CAUSA: Problema de rede ou VPS');
    }

    // === SCRIPT DE CORREÇÃO INTELIGENTE ===
    const optimizedDeployScript = generateOptimizedDeployScript();

    // === INSTRUÇÕES ESPECÍFICAS BASEADAS NO DIAGNÓSTICO ===
    let specificInstructions = {};
    
    if (apiOnline && !whatsappOnline) {
      specificInstructions = {
        step1: `Conecte na VPS: ssh root@${VPS_HOST}`,
        step2: 'Execute estes comandos para diagnosticar o WhatsApp Server:',
        step3: `
# Verificar se há algum processo na porta 3001
sudo netstat -tlnp | grep :3001

# Verificar processos Node.js rodando
ps aux | grep node

# Verificar diretórios WhatsApp
ls -la /root/ | grep whatsapp

# Tentar iniciar WhatsApp Server manualmente
cd /root/whatsapp-web-server 2>/dev/null || cd /root/whatsapp-server 2>/dev/null || echo "Diretório WhatsApp não encontrado"
`,
        step4: 'Execute o script completo apenas se necessário'
      };
    } else {
      specificInstructions = {
        step1: `Conecte na VPS: ssh root@${VPS_HOST}`,
        step2: 'Execute o script de correção completo fornecido',
        step3: 'Aguarde a verificação e ajustes (2-3 minutos)',
        step4: `Teste: curl http://localhost:80/health && curl http://localhost:3001/health`
      };
    }

    return buildFailureResponse(
      VPS_HOST,
      { online: apiOnline, data: apiData, attempt: 1 },
      { online: whatsappOnline, data: whatsappData, attempt: 1 },
      optimizedDeployScript,
      specificInstructions
    );

  } catch (error) {
    console.log('❌ ERRO GERAL NO DEPLOY:', error.message);
    return buildErrorResponse(error);
  }
});
