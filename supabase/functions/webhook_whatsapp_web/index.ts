
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Declarações de tipo para resolver erros
declare const Deno: any;

// Tipos para processamento de mídia
interface ProcessedMediaData {
  cacheId: string;
  base64Data: string;
  fileSizeBytes: number;
  fileSizeMB: number;
  storageUrl?: string; // ✅ NOVO: URL do Storage
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`[${requestId}] 🚀 WhatsApp Web Webhook - VERSÃO FUNCIONAL RECUPERADA:`, JSON.stringify(body, null, 2));

    const { event, instanceId, data } = body;

    if (event !== 'message_received') {
      return new Response(JSON.stringify({ success: true, message: 'Event not processed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`[${requestId}] 🔄 Processando evento: ${event} para instância: ${instanceId}`);

    // 1. BUSCAR INSTÂNCIA
    console.log(`[${requestId}] 🔍 BUSCANDO INSTÂNCIA: ${instanceId}`);
    
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('id, created_by_user_id')
      .eq('vps_instance_id', instanceId)
      .single();

    if (instanceError || !instance) {
      console.log(`[${requestId}] ❌ Instância não encontrada: ${instanceId}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Instance not found',
        instanceId 
      }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`[${requestId}] 💬 Processando mensagem com CONVERSÃO DE MÍDIA para: ${instanceId}`);

    // 2. EXTRAIR DADOS DA MENSAGEM
    const messageType = data.messageType || body.messageType || 'text';
    const messageText = data.body || body.message?.text || '[Mensagem não suportada]';
    
    // 🚀 CORREÇÃO: Apenas remover o sufixo @s.whatsapp.net (formato já vem correto: 556299999999@s.whatsapp.net)
    const fromPhone = data.from?.replace('@s.whatsapp.net', '') || body.from?.replace('@s.whatsapp.net', '') || '';
    
    const messageId = data.messageId || body.data?.messageId;
    const isFromMe = data.fromMe || body.fromMe || false;
    const createdByUserId = instance.created_by_user_id;
    
    console.log(`[${requestId}] 📱 Telefone processado: ${fromPhone}`);
    
    // ✅ FORMATAÇÃO DO NOME PARA PADRÃO WHATSAPP: +55 62 9999-9999
    let formattedContactName = body.contactName || null;
    
    // Se não há nome real do contato, gerar nome formatado
    if (!formattedContactName) {
      // Converter 556281316387 → +55 62 9999-9999
      if (fromPhone && fromPhone.length >= 12 && fromPhone.startsWith('55')) {
        const countryCode = fromPhone.substring(0, 2); // 55
        const areaCode = fromPhone.substring(2, 4);    // 62
        const number = fromPhone.substring(4);         // 81316387
        
        // Formato brasileiro: +55 62 9999-9999
        if (number.length === 9) {
          // Celular com 9º dígito: +55 62 99999-9999
          formattedContactName = `+${countryCode} ${areaCode} ${number.substring(0, 5)}-${number.substring(5)}`;
        } else if (number.length === 8) {
          // Fixo: +55 62 9999-9999
          formattedContactName = `+${countryCode} ${areaCode} ${number.substring(0, 4)}-${number.substring(4)}`;
        } else {
          // Outros tamanhos: manter formato básico
          formattedContactName = `+${countryCode} ${areaCode} ${number}`;
        }
      } else if (fromPhone && fromPhone.length >= 10) {
        // Para outros países: detectar código do país
        if (fromPhone.startsWith('1')) {
          // EUA/Canadá: +1 999 999-9999
          const areaCode = fromPhone.substring(1, 4);
          const number = fromPhone.substring(4);
          formattedContactName = `+1 ${areaCode} ${number.substring(0, 3)}-${number.substring(3)}`;
        } else if (fromPhone.startsWith('34')) {
          // Espanha: +34 999 999 999
          const number = fromPhone.substring(2);
          formattedContactName = `+34 ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
        } else {
          // Formato genérico para outros países
          formattedContactName = `+${fromPhone}`;
        }
      } else {
        // Fallback para números muito curtos
        formattedContactName = `+55 ${fromPhone}`;
      }
    }

    console.log(`[${requestId}] 📱 Mensagem ${isFromMe ? 'ENVIADA PARA' : 'RECEBIDA DE'}: ${fromPhone} | Nome: ${formattedContactName} | Tipo: ${messageType} | Texto: ${messageText.substring(0, 50)}...`);
    console.log(`[${requestId}] 📍 Direção da mensagem: ${isFromMe ? 'ENVIADA' : 'RECEBIDA'} (from_me: ${isFromMe})`);

    // 3. DETECTAR E PROCESSAR MÍDIA - VERSÃO MELHORADA
    let mediaUrl: string | null = null;
    let processedMediaData: ProcessedMediaData | null = null;
    
    if (messageType !== 'text' && messageType !== 'chat') {
      console.log(`[${requestId}] 🎬 MÍDIA DETECTADA: ${messageType}`);
      console.log(`[${requestId}] 🔍 PAYLOAD COMPLETO PARA MÍDIA:`, JSON.stringify(body, null, 2));
      
      // EXTRAÇÃO EXPANDIDA DE URL DA MÍDIA - INCLUINDO CAMPOS ESPECÍFICOS DO PAYLOAD
      const potentialUrls = [
        // Campos diretos no data
        data?.mediaUrl,
        data?.media_url,
        data?.media?.url,
        data?.url,
        data?.mediaData?.url,
        data?.attachment?.url,
        
        // Campos diretos no body
        body?.mediaUrl,
        body?.media_url,
        body?.media?.url,
        body?.url,
        body?.mediaData?.url,
        body?.attachment?.url,
        
        // Campos aninhados específicos para WhatsApp
        body?.data?.mediaUrl,
        body?.data?.media_url,
        body?.data?.media?.url,
        body?.data?.url,
        body?.message?.mediaUrl,
        body?.message?.media_url,
        body?.message?.media?.url,
        body?.message?.url,
        
        // 🆕 CAMPOS ESPECÍFICOS ENCONTRADOS NOS LOGS
        body?.data?.image?.url,
        body?.data?.video?.url,
        body?.data?.audio?.url,
        body?.data?.document?.url,
        body?.message?.image?.url,
        body?.message?.video?.url,
        body?.message?.audio?.url,
        body?.message?.document?.url,
        
        // Campos específicos por tipo de mídia
        body?.image?.url,
        body?.video?.url,
        body?.audio?.url,
        body?.document?.url,
        body?.sticker?.url,
        data?.image?.url,
        data?.video?.url,
        data?.audio?.url,
        data?.document?.url,
        data?.sticker?.url,
        
        // Campos de mensagem com mídia
        body?.message?.image?.url,
        body?.message?.video?.url,
        body?.message?.audio?.url,
        body?.message?.document?.url,
        body?.message?.sticker?.url,
        
        // 🆕 TENTATIVA DE CONSTRUIR URL BASEADA NO MESSAGEID E INSTANCEID
        body?.data?.messageId && instanceId ? 
          `https://api.whatsapp.com/media/${body.data.messageId}` : null,
        
        // Campos alternativos
        body?.file?.url,
        body?.attachment,
        data?.file?.url,
        data?.attachment
      ].filter(Boolean);
      
      console.log(`[${requestId}] 📎 URLs potenciais encontradas:`, potentialUrls);
      
      if (potentialUrls.length > 0) {
        const potentialUrl = potentialUrls[0];
        if (potentialUrl && typeof potentialUrl === 'string') {
          mediaUrl = potentialUrl;
        console.log(`[${requestId}] ✅ URL da mídia selecionada: ${mediaUrl.substring(0, 80)}...`);
        
        // VALIDAR SE A URL É VÁLIDA
          if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
          console.log(`[${requestId}] 🔗 URL válida detectada, iniciando processamento...`);
          
          // PROCESSAR MÍDIA IMEDIATAMENTE
          try {
                         // ✅ CORRIGIDO: Passar messageDbId e externalMessageId para relacionar cache
             processedMediaData = await processMediaToBase64(supabase, messageId, mediaUrl, messageType, requestId, undefined, messageId);
            console.log(`[${requestId}] ✅ Mídia processada com sucesso`);
          } catch (mediaError) {
            console.log(`[${requestId}] ⚠️ Erro ao processar mídia: ${mediaError.message}`);
            // Continua sem mídia processada, mas salva URL para tentar depois
          }
        } else {
          console.log(`[${requestId}] ❌ URL inválida ou não é HTTP/HTTPS: ${mediaUrl}`);
          mediaUrl = null;
          }
        }
      } else {
        console.log(`[${requestId}] ⚠️ Mídia detectada mas URL não encontrada no payload`);
        console.log(`[${requestId}] 🔍 CAMPOS DISPONÍVEIS NO BODY:`, Object.keys(body));
        console.log(`[${requestId}] 🔍 CAMPOS DISPONÍVEIS NO DATA:`, Object.keys(data || {}));
        
        // 🆕 ANÁLISE DETALHADA DO PAYLOAD PARA ENTENDER A ESTRUTURA
        if (body?.data) {
          console.log(`[${requestId}] 🔍 CAMPOS EM BODY.DATA:`, Object.keys(body.data));
        }
        if (body?.message) {
          console.log(`[${requestId}] 🔍 CAMPOS EM BODY.MESSAGE:`, Object.keys(body.message));
        }
        
        // TENTAR CONSTRUIR URL A PARTIR DE ID DA MENSAGEM (se disponível)
        if (messageId) {
          console.log(`[${requestId}] 🔄 Tentativa de construir URL a partir do messageId: ${messageId}`);
          // Aqui poderia implementar lógica para construir URL baseada no messageId se necessário
        }
      }
    }

    // 4. SALVAR MENSAGEM NO BANCO DE DADOS
    console.log(`[${requestId}] 💾 Salvando mensagem no banco...`);
    
    const { data: messageResult, error: messageError } = await supabase.rpc(
      'save_whatsapp_message_service_role',
      {
        p_vps_instance_id: instanceId,  // ✅ CORREÇÃO: usar p_vps_instance_id
        p_phone: fromPhone,
        p_message_text: messageText,    // ✅ CORREÇÃO: usar p_message_text
        p_from_me: isFromMe,
        p_media_type: messageType,
        p_media_url: mediaUrl,
        p_external_message_id: messageId,
        p_contact_name: formattedContactName
      }
    );

    if (messageError) {
      console.log(`[${requestId}] ❌ Erro ao salvar mensagem: ${messageError.message}`);
      
      // ✅ FALLBACK: Tentar salvar de forma mais simples se a função principal falhar
      console.log(`[${requestId}] 💾 Salvando mensagem usando função simples`);
      
      try {
        // Buscar instância primeiro
        const { data: instanceData, error: instanceError } = await supabase
          .from('whatsapp_instances')
          .select('id, created_by_user_id')
          .eq('vps_instance_id', instanceId)
          .single();
        
        if (instanceError || !instanceData) {
          throw new Error(`Instância não encontrada: ${instanceId}`);
        }
        
        // Tentar inserir lead básico primeiro
        const leadPhone = fromPhone.replace(/[^\d]/g, '');
        
        const { data: leadData, error: leadError } = await supabase
          .from('leads')
          .upsert({
            phone: leadPhone,
            name: formattedContactName || `Contato ${leadPhone}`,
            whatsapp_number_id: instanceData.id,
            created_by_user_id: instanceData.created_by_user_id,
            import_source: 'webhook_fallback'
          }, {
            onConflict: 'phone,created_by_user_id',
            ignoreDuplicates: false
          })
          .select('id')
          .single();
        
        if (leadError) {
          console.log(`[${requestId}] ⚠️ Erro ao criar lead:`, leadError.message);
        }
        
        // Inserir mensagem básica
        const { data: messageData, error: msgError } = await supabase
          .from('messages')
          .insert({
            lead_id: leadData?.id,
            whatsapp_number_id: instanceData.id,
            text: messageText,
            from_me: isFromMe,
            media_type: messageType || 'text',
            media_url: mediaUrl,
            external_message_id: messageId,
            created_by_user_id: instanceData.created_by_user_id,
            import_source: 'webhook_fallback',
            timestamp: new Date().toISOString()
          })
          .select('id')
          .single();
        
        if (msgError) {
          throw msgError;
        }
        
        console.log(`[${requestId}] ✅ Mensagem salva via fallback: ${messageData.id}`);
        
        // ✅ ATUALIZAR MEDIA_CACHE COM MESSAGE_ID DO FALLBACK
        if (processedMediaData && messageData.id && messageId) {
          try {
            console.log(`[${requestId}] 🔄 Atualizando media_cache com message_id do fallback...`);
            
            const { error: updateError } = await supabase
              .from('media_cache')
              .update({
                message_id: messageData.id,  // ✅ ID da tabela messages
                external_message_id: messageId // ✅ external_message_id para agente IA
              })
              .or(`original_url.like.%${messageId}%,created_at.gte.${new Date(Date.now() - 60000).toISOString()}`)
              .eq('media_type', messageType)
              .is('message_id', null);
              
            if (updateError) {
              console.error(`[${requestId}] ⚠️ Erro ao atualizar media_cache:`, updateError);
            } else {
              console.log(`[${requestId}] ✅ Media_cache atualizado com IDs do fallback:`, {
                messageId: messageData.id,
                externalMessageId: messageId,
                mediaType: messageType
              });
            }
          } catch (updateError) {
            console.error(`[${requestId}] ⚠️ Erro na atualização do cache:`, updateError);
          }
        }
        
        // Retornar sucesso com dados do fallback
        return new Response(JSON.stringify({ 
          success: true, 
          messageId: messageData.id,
          leadId: leadData?.id,
          method: 'fallback',
          requestId
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
      } catch (fallbackError: any) {
        console.log(`[${requestId}] ❌ Fallback também falhou:`, fallbackError.message);
        
      return new Response(JSON.stringify({ 
          error: `Função principal falhou: ${messageError.message}. Fallback falhou: ${fallbackError.message}`,
        requestId
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
      }
    }

    const { lead_id: leadId, message_id: messageDbId } = messageResult;
    console.log(`[${requestId}] ✅ Mensagem salva: ${messageDbId} | Lead: ${leadId}`);

    // 6. SE MÍDIA FOI PROCESSADA, ASSOCIAR À MENSAGEM
    if (processedMediaData && messageDbId) {
      console.log(`[${requestId}] 🔗 Associando mídia processada à mensagem: ${messageDbId}`);
      
      const { error: updateCacheError } = await supabase
        .from('media_cache')
        .update({ message_id: messageDbId })
        .eq('id', processedMediaData.cacheId);

      if (updateCacheError) {
        console.log(`[${requestId}] ⚠️ Erro ao associar mídia: ${updateCacheError.message}`);
      } else {
        console.log(`[${requestId}] ✅ Mídia associada com sucesso`);
      }
    }

    // 🚀 NOVO: EXECUTAR RECUPERAÇÃO DE MÍDIAS PERDIDAS (TEMPORARIAMENTE DESABILITADO)
    // DESABILITADO TEMPORARIAMENTE PARA ISOLAR ERRO supabase.raw
    // const shouldRecoverMedia = Math.random() < 0.1; // 10% de chance
    // if (shouldRecoverMedia) {
    //   console.log(`[${requestId}] 🔄 Iniciando recuperação de mídias perdidas em background...`);
    //   
    //   // Executar recuperação sem aguardar (background)
    //   processLostMediaRecovery(supabase, `${requestId}-bg`).then(result => {
    //     console.log(`[${requestId}] 📊 Recuperação background concluída:`, result);
    //   }).catch(error => {
    //     console.error(`[${requestId}] ❌ Erro na recuperação background:`, error);
    //   });
    // }

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: messageDbId,
      leadId: leadId,
      mediaProcessed: !!processedMediaData,
      mediaUrl: mediaUrl,
      requestId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro geral no webhook:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});

// FUNÇÃO PARA PROCESSAR MÍDIA (VERSÃO APRIMORADA COM STORAGE)
async function processMediaToBase64(
  supabase: any, 
  messageId: string, 
  mediaUrl: string, 
  mediaType: string, 
  requestId: string,
  dbMessageId?: string, // ✅ NOVO: ID da mensagem no banco
  externalMessageId?: string // ✅ NOVO: external_message_id para busca do agente IA
): Promise<ProcessedMediaData> {
  try {
    console.log(`[${requestId}] 🔄 Baixando mídia de: ${mediaUrl.substring(0, 80)}...`);

    // 1. Fazer download da mídia
    const response = await fetch(mediaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WhatsApp-Bot/1.0)',
        'Accept': '*/*'
      }
    });

    if (!response.ok) {
      throw new Error(`Falha no download da mídia: ${response.status} - ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const fileSizeBytes = bytes.length;
    const fileSizeMB = fileSizeBytes / (1024 * 1024);

    console.log(`[${requestId}] 📊 Mídia baixada: ${fileSizeMB.toFixed(2)}MB (${fileSizeBytes} bytes)`);

    // 2. Converter para base64
    let binaryString = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const base64Data = btoa(binaryString);

    console.log(`[${requestId}] 🔄 Mídia convertida para base64: ${base64Data.length} caracteres`);

    // ✅ 3. NOVO: TENTAR SALVAR NO STORAGE PRIMEIRO
    let storageUrl = null;
    try {
      // Detectar MIME type
      const mimeMatch = mediaUrl.match(/\.(jpg|jpeg|png|gif|webp|mp4|mp3|wav|ogg|m4a|pdf|doc|docx|avi|mov|wmv)$/i);
      let contentType = 'application/octet-stream';
      let extension = 'bin';
      
      if (mimeMatch) {
        extension = mimeMatch[1].toLowerCase();
        switch (extension) {
          case 'jpg':
          case 'jpeg':
            contentType = 'image/jpeg';
            break;
          case 'png':
            contentType = 'image/png';
            break;
          case 'gif':
            contentType = 'image/gif';
            break;
          case 'webp':
            contentType = 'image/webp';
            break;
          case 'mp4':
            contentType = 'video/mp4';
            break;
          case 'avi':
            contentType = 'video/x-msvideo';
            break;
          case 'mov':
            contentType = 'video/quicktime';
            break;
          case 'wmv':
            contentType = 'video/x-ms-wmv';
            break;
          case 'mp3':
            contentType = 'audio/mpeg';
            break;
          case 'wav':
            contentType = 'audio/wav';
            break;
          case 'ogg':
            contentType = 'audio/ogg';
            break;
          case 'm4a':
            contentType = 'audio/mp4';
            break;
          case 'pdf':
            contentType = 'application/pdf';
            break;
          case 'doc':
            contentType = 'application/msword';
            break;
          case 'docx':
            contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            break;
        }
      }

      // Gerar nome único
      const fileName = `received_${Date.now()}_${messageId || Math.random().toString(36).substring(7)}.${extension}`;
      
      console.log(`[${requestId}] 🗄️ Tentando salvar no Storage: ${fileName} (${contentType})`);
      
             // Upload para Storage
       const { data: uploadData, error: uploadError } = await supabase.storage
         .from('whatsapp-media')
        .upload(fileName, bytes, {
          contentType: contentType,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.log(`[${requestId}] ⚠️ Storage upload falhou, usando cache tradicional:`, uploadError.message);
      } else {
        // Obter URL pública
        const { data: urlData } = supabase.storage
          .from('whatsapp-media')
          .getPublicUrl(fileName);
          
        storageUrl = urlData.publicUrl;
        console.log(`[${requestId}] ✅ Mídia salva no Storage: ${storageUrl.substring(0, 80)}...`);
      }
    } catch (storageError) {
      console.log(`[${requestId}] ⚠️ Erro no Storage, continuando com cache:`, storageError.message);
    }

    // ✅ 4. SALVAR NO CACHE (URL Storage se disponível, senão base64)
    let cacheId = '';
    try {
      const cachePayload = storageUrl ? {
        // ✅ CORRIGIDO: Se tem Storage URL, salvar URL pequena
        message_id: dbMessageId || null,  // ✅ NOVO: Relacionar com mensagem
        external_message_id: externalMessageId || null, // ✅ NOVO: Para busca do agente IA
        original_url: storageUrl,
        base64_data: null,
        file_name: messageId || 'received_media',
        file_size: fileSizeBytes,
        media_type: mediaType,
        created_at: new Date().toISOString()
      } : {
        // ✅ CORRIGIDO: Fallback com message_id e external_message_id
        message_id: dbMessageId || null,  // ✅ NOVO: Relacionar com mensagem
        external_message_id: externalMessageId || null, // ✅ NOVO: Para busca do agente IA
        original_url: base64Data.length > 6000 ? null : `data:application/octet-stream;base64,${base64Data}`,
        base64_data: base64Data.length > 6000 ? null : base64Data,
        file_name: messageId || 'received_media',
        file_size: fileSizeBytes,
        media_type: mediaType,
        created_at: new Date().toISOString()
      };

      const { data: cacheData, error: cacheError } = await supabase
        .from('media_cache')
        .insert(cachePayload)
      .select('id')
        .single();

    if (cacheError) {
        console.log(`[${requestId}] ⚠️ Erro ao salvar no cache: ${cacheError.message}`);
        cacheId = 'cache_error';
      } else {
        cacheId = cacheData.id;
        console.log(`[${requestId}] ✅ Mídia salva no cache: ID ${cacheId}`);
      }
    } catch (error) {
      console.log(`[${requestId}] ⚠️ Erro no cache: ${error.message}`);
      cacheId = 'cache_error';
    }

    return {
      cacheId,
      base64Data,
      fileSizeBytes,
      fileSizeMB,
      storageUrl // ✅ NOVO: incluir URL do Storage
    };

  } catch (error) {
    console.log(`[${requestId}] ❌ Erro no processamento da mídia: ${error.message}`);
    throw error;
  }
}

// 🚀 NOVA FUNÇÃO: RECUPERAÇÃO RETROATIVA DE MÍDIAS PERDIDAS
async function processLostMediaRecovery(supabase: any, requestId: string) {
  console.log(`[${requestId}] 🔄 Iniciando recuperação de mídias perdidas...`);
  
  try {
    // Buscar mensagens com mídia que não têm cache associado (query simplificada)
    const { data: lostMedia, error: queryError } = await supabase
      .from('messages')
      .select('id, media_type, media_url, external_message_id, created_at')
      .neq('media_type', 'text')
      .not('media_url', 'is', null)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Últimas 24 horas
      .limit(5);

    if (queryError) {
      console.error(`[${requestId}] ❌ Erro ao buscar mídias perdidas:`, queryError);
      return { recovered: 0, errors: 1 };
    }

    if (!lostMedia || lostMedia.length === 0) {
      console.log(`[${requestId}] ✅ Nenhuma mídia perdida encontrada`);
      return { recovered: 0, errors: 0 };
    }

    console.log(`[${requestId}] 🔍 Encontradas ${lostMedia.length} mídias perdidas para recuperar`);

    let recovered = 0;
    let errors = 0;

    // Processar cada mídia perdida
    for (const media of lostMedia) {
      try {
        console.log(`[${requestId}] 🔄 Recuperando mídia: ${media.id} (${media.media_type})`);
        
        const processedData = await processMediaToBase64(
          supabase, 
          media.id, 
          media.media_url, 
          media.media_type, 
          `${requestId}-recovery`
        );

        // Associar à mensagem
        const { error: updateError } = await supabase
          .from('media_cache')
          .update({ message_id: media.id })
          .eq('id', processedData.cacheId);

        if (updateError) {
          console.error(`[${requestId}] ❌ Erro ao associar mídia recuperada:`, updateError);
          errors++;
        } else {
          console.log(`[${requestId}] ✅ Mídia recuperada: ${media.id}`);
          recovered++;
        }

        // Pequena pausa para evitar sobrecarga
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`[${requestId}] ❌ Erro ao recuperar mídia ${media.id}:`, error);
        errors++;
      }
    }

    console.log(`[${requestId}] 📊 Recuperação concluída: ${recovered} sucessos, ${errors} erros`);
    return { recovered, errors };

  } catch (error) {
    console.error(`[${requestId}] ❌ Erro geral na recuperação:`, error);
    return { recovered: 0, errors: 1 };
  }
}
