
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Declarações de tipo para resolver erros
declare const Deno: any;

// ✅ PROCESSADOR DE MÍDIA INTEGRADO
interface MediaProcessorOptions {
  messageId: string;
  mediaUrl: string;
  mediaType: string;
  externalMessageId?: string;
}

interface ProcessedMediaResult {
  success: boolean;
  cacheId?: string;
  base64Data?: string;
  fileSize?: number;
  error?: string;
}

class MediaProcessor {
  private static supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  /**
   * ✅ PROCESSO COMPLETO: Baixar mídia e criar cache com Base64
   */
  static async processMediaForMessage(options: MediaProcessorOptions): Promise<ProcessedMediaResult> {
    const { messageId, mediaUrl, mediaType, externalMessageId } = options;
    
    try {
      console.log(`[MediaProcessor] 🚀 Processando mídia: ${messageId} (${mediaType})`);
      
      // ETAPA 1: Baixar mídia da URL original
      const mediaData = await this.downloadMedia(mediaUrl);
      if (!mediaData.success) {
        return { success: false, error: mediaData.error };
      }

             // ETAPA 2: Verificar tamanho antes de processar Base64
       const fileSize = mediaData.buffer!.byteLength;
       const shouldSaveBase64 = this.shouldSaveAsBase64(mediaType, fileSize);
       
       // ETAPA 3: Converter para Base64 APENAS se necessário (otimização)
       let base64Data = '';
       if (shouldSaveBase64) {
         console.log(`[MediaProcessor] 🔄 Convertendo para Base64 (arquivo pequeno: ${(fileSize/1024).toFixed(1)}KB)`);
         base64Data = await this.convertToBase64(mediaData.buffer!);
       } else {
         console.log(`[MediaProcessor] ⚡ Pulando Base64 (arquivo grande: ${(fileSize/1024).toFixed(1)}KB) - apenas Storage`);
       }
      
      console.log(`[MediaProcessor] 📊 Arquivo ${mediaType}: ${(fileSize / 1024).toFixed(1)}KB - Base64: ${shouldSaveBase64 ? 'SIM' : 'NÃO'}`);

      // ETAPA 4: Salvar no Storage (sempre)
      const storageResult = await this.saveToStorage(messageId, mediaData.buffer!, mediaType);
      
      // ETAPA 5: Criar/Atualizar media_cache
      const { data: cacheData, error: cacheError } = await this.supabase
        .from('media_cache')
        .upsert({
          message_id: messageId,
          external_message_id: externalMessageId,
          original_url: mediaUrl,
          cached_url: storageResult.publicUrl,
          base64_data: shouldSaveBase64 ? base64Data : null,
          file_size: fileSize,
          media_type: mediaType,
          file_name: this.generateFileName(externalMessageId, mediaType),
          created_at: new Date().toISOString()
        }, {
          onConflict: 'message_id',
          ignoreDuplicates: false
        })
        .select('id')
        .single();

      if (cacheError) {
        console.error(`[MediaProcessor] ❌ Erro ao salvar cache: ${cacheError.message}`);
        return { success: false, error: cacheError.message };
      }

      console.log(`[MediaProcessor] ✅ Mídia processada com sucesso: ${cacheData.id}`);
      
      return {
        success: true,
        cacheId: cacheData.id,
        base64Data: shouldSaveBase64 ? base64Data : undefined,
        fileSize
      };

    } catch (error) {
      console.error(`[MediaProcessor] ❌ Erro geral: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Baixar mídia da URL
   */
  private static async downloadMedia(url: string): Promise<{ success: boolean; buffer?: ArrayBuffer; error?: string }> {
    try {
      console.log(`[MediaProcessor] 📥 Baixando mídia: ${url.substring(0, 80)}...`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'WhatsApp/2.23.20.0',
          'Accept': '*/*'
        }
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }

      const buffer = await response.arrayBuffer();
      console.log(`[MediaProcessor] ✅ Mídia baixada: ${(buffer.byteLength / 1024).toFixed(1)}KB`);
      
      return { success: true, buffer };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Converter ArrayBuffer para Base64 com processamento seguro para dados binários
   */
  private static async convertToBase64(buffer: ArrayBuffer): Promise<string> {
    // ✅ CORREÇÃO CRÍTICA: Usar método nativo do Deno para dados binários
    const bytes = new Uint8Array(buffer);
    let binary = '';
    
    // ✅ MÉTODO CORRETO: Converter byte por byte para evitar corrupção
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return btoa(binary);
  }

  /**
   * Decidir se deve salvar como Base64 (arquivos pequenos) ou só metadados
   * ✅ LIMITES SEGUROS PARA EVITAR MEMORY OVERFLOW
   */
  private static shouldSaveAsBase64(mediaType: string, fileSize: number): boolean {
    // ✅ LIMITES OTIMIZADOS PARA RENDERIZAÇÃO INSTANTÂNEA
    const maxSizeForBase64 = {
      'image': 3 * 1024 * 1024,    // 3MB para imagens (fotos alta qualidade)
      'audio': 2 * 1024 * 1024,    // 2MB para áudios (mensagens longas)
      'video': 5 * 1024 * 1024,    // 5MB para vídeos (GIFs, clips curtos)
      'document': 2 * 1024 * 1024  // 2MB para documentos (PDFs médios)
    };

    const limit = maxSizeForBase64[mediaType as keyof typeof maxSizeForBase64] || 0;
    const shouldSave = fileSize <= limit;
    
    console.log(`[MediaProcessor] 📊 Base64 check: ${mediaType} ${(fileSize/1024).toFixed(1)}KB - Limite: ${(limit/1024).toFixed(1)}KB - Resultado: ${shouldSave ? 'SALVAR' : 'STORAGE ONLY'}`);
    
    return shouldSave;
  }

  /**
   * Salvar no Supabase Storage
   */
  private static async saveToStorage(messageId: string, buffer: ArrayBuffer, mediaType: string): Promise<{ publicUrl: string }> {
    const fileExtension = this.getFileExtension(mediaType);
    const fileName = `${messageId}_${Date.now()}.${fileExtension}`;
    
    const { data: uploadData, error: uploadError } = await this.supabase.storage
      .from('whatsapp-media')
      .upload(fileName, buffer, {
        contentType: this.getMimeType(mediaType),
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Erro ao fazer upload: ${uploadError.message}`);
    }

    const { data: urlData } = this.supabase.storage
      .from('whatsapp-media')
      .getPublicUrl(fileName);

    return { publicUrl: urlData.publicUrl };
  }

  /**
   * Gerar nome do arquivo
   */
  private static generateFileName(externalId?: string, mediaType?: string): string {
    const prefix = externalId ? externalId.substring(0, 20) : 'unknown';
    return `${prefix}_${mediaType || 'media'}`;
  }

  /**
   * Obter extensão do arquivo baseado no tipo
   */
  private static getFileExtension(mediaType: string): string {
    switch (mediaType) {
      case 'image': return 'jpg';
      case 'video': return 'mp4';
      case 'audio': return 'ogg';
      case 'document': return 'pdf';
      default: return 'bin';
    }
  }

  /**
   * Obter MIME type
   */
  private static getMimeType(mediaType: string): string {
    switch (mediaType) {
      case 'image': return 'image/jpeg';
      case 'video': return 'video/mp4';
      case 'audio': return 'audio/ogg';
      case 'document': return 'application/pdf';
      default: return 'application/octet-stream';
    }
  }
}

// ✅ TIPOS OTIMIZADOS PARA PROCESSAMENTO DE MÍDIA
interface ProcessedMediaData {
  cacheId: string;
  base64Data: string;
  fileSizeBytes: number;
  fileSizeMB: number;
  storageUrl?: string;
  isStorageSaved: boolean; // ✅ NOVO: Indica se foi salvo no Storage
}

interface MediaCacheEntry {
  id: string;
  message_id: string | null;
  external_message_id: string | null;
  original_url: string;
  base64_data: string | null;
  file_size: number;
  media_type: string;
  created_at: string;
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
    
    console.log(`[${requestId}] 🚀 WhatsApp Web Webhook - VERSÃO OTIMIZADA:`, JSON.stringify(body, null, 2));

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

    console.log(`[${requestId}] 💬 Processando mensagem com MÍDIA OTIMIZADA para: ${instanceId}`);

    // 2. EXTRAIR DADOS DA MENSAGEM
    let messageType = data.messageType || body.messageType || 'text';
    
    // ✅ CORREÇÃO: Mapear tipos não suportados para 'text'
    const validMediaTypes = ['text', 'image', 'video', 'audio', 'document'];
    if (!validMediaTypes.includes(messageType)) {
      console.log(`[${requestId}] ⚠️ Tipo não suportado '${messageType}', convertendo para 'text'`);
      messageType = 'text';
    }
    // ✅ FILTRAR TEXTOS PADRÃO INDEVIDOS
    let messageText = data.body || body.message?.text || '';
    
    // 🚫 REMOVER TEXTOS PADRÃO QUE NÃO DEVEM APARECER COMO LEGENDA
    const invalidTexts = [
      '[Mensagem não suportada]',
      'Mensagem não suportada',
      'Message not supported',
      'Conteúdo não disponível',
      'Mídia não disponível'
    ];
    
    if (invalidTexts.includes(messageText)) {
      messageText = ''; // ✅ Limpar texto indevido
    }
    const fromPhone = data.from?.replace('@s.whatsapp.net', '') || body.from?.replace('@s.whatsapp.net', '') || '';
    const messageId = data.messageId || body.data?.messageId;
    const isFromMe = data.fromMe || body.fromMe || false;
    const createdByUserId = instance.created_by_user_id;
    
    console.log(`[${requestId}] 📱 Telefone processado: ${fromPhone}`);
    
    // ✅ FORMATAÇÃO DO NOME PARA PADRÃO WHATSAPP (CORRIGIDO - SEM DUPLICAR +55)
    let formattedContactName = body.contactName || null;
    
    if (!formattedContactName) {
      if (fromPhone && fromPhone.length >= 11) {
        // ✅ CORREÇÃO: Verificar se já tem código do país brasileiro (55)
        if (fromPhone.startsWith('55') && fromPhone.length >= 12) {
          // ✅ JÁ TEM CÓDIGO DO PAÍS - não duplicar
          const areaCode = fromPhone.substring(2, 4);
          const number = fromPhone.substring(4);
          
          if (number.length === 9) {
            formattedContactName = `+55 (${areaCode}) ${number.substring(0, 5)}-${number.substring(5)}`;
          } else if (number.length === 8) {
            formattedContactName = `+55 (${areaCode}) ${number.substring(0, 4)}-${number.substring(4)}`;
          } else {
            formattedContactName = `+55 (${areaCode}) ${number}`;
          }
        } else {
          // ✅ NÃO TEM CÓDIGO DO PAÍS - assumir Brasil e adicionar 55
          const areaCode = fromPhone.substring(0, 2);
          const number = fromPhone.substring(2);
          
          if (number.length === 9) {
            formattedContactName = `+55 (${areaCode}) ${number.substring(0, 5)}-${number.substring(5)}`;
          } else if (number.length === 8) {
            formattedContactName = `+55 (${areaCode}) ${number.substring(0, 4)}-${number.substring(4)}`;
          } else {
            formattedContactName = `+55 (${areaCode}) ${number}`;
          }
        }
      } else {
        formattedContactName = `+55 ${fromPhone}`;
      }
    }

    console.log(`[${requestId}] 📱 Mensagem ${isFromMe ? 'ENVIADA PARA' : 'RECEBIDA DE'}: ${fromPhone} | Nome: ${formattedContactName} | Tipo: ${messageType}`);

    // ✅ 3. SALVAR MENSAGEM PRIMEIRO (PARA TER message_id)
    console.log(`[${requestId}] 💾 Salvando mensagem no banco PRIMEIRO...`);
    
    const { data: messageResult, error: messageError } = await supabase.rpc(
      'save_whatsapp_message_service_role',
      {
        p_vps_instance_id: instanceId,
        p_phone: fromPhone,
        p_message_text: messageText,
        p_from_me: isFromMe,
        p_media_type: messageType,
                 p_media_url: undefined, // ✅ Será atualizado após processamento
        p_external_message_id: messageId,
        p_contact_name: formattedContactName
      }
    );

    if (messageError) {
      console.log(`[${requestId}] ❌ Erro ao salvar mensagem: ${messageError.message}`);
      return new Response(JSON.stringify({ 
        error: `Falha ao salvar mensagem: ${messageError.message}`,
        requestId
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // ✅ DEBUG: Ver o que a função está retornando
    console.log(`[${requestId}] 🔍 DEBUG messageResult:`, JSON.stringify(messageResult, null, 2));
    
    // ✅ VERIFICAÇÃO DE SEGURANÇA: Se função falhou, parar o processamento
    if (!messageResult.success || !messageResult.data) {
      console.log(`[${requestId}] ❌ Falha na função PostgreSQL: ${messageResult.error}`);
      return new Response(JSON.stringify({ 
        error: `Falha na função PostgreSQL: ${messageResult.error}`,
        details: messageResult,
        requestId
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    // ✅ CORREÇÃO: A função retorna { data: { message_id, lead_id } }
    const { data: messageData } = messageResult;
    const { message_id: messageDbId, lead_id: leadId } = messageData;
    console.log(`[${requestId}] ✅ Mensagem salva: ${messageDbId} | Lead: ${leadId}`);

    // ✅ 4. DETECTAR E PROCESSAR MÍDIA (AGORA COM message_id DISPONÍVEL)
    let processedMediaData: ProcessedMediaData | null = null;
    let finalMediaUrl: string | null = null;
    
    if (messageType !== 'text' && messageType !== 'chat') {
      console.log(`[${requestId}] 🎬 MÍDIA DETECTADA: ${messageType}`);
      
      // 🚀 PRIORIDADE 1: VERIFICAR SE VPS JÁ ENVIOU BASE64
      const vpsBase64 = data?.mediaBase64 || body?.mediaBase64 || body?.data?.mediaBase64;
      const vpsMediaSize = data?.mediaSize || body?.mediaSize || body?.data?.mediaSize;
      const instancePhone = data?.instancePhone || body?.instancePhone;
      
      console.log(`[${requestId}] 🔍 DEBUG VPS payload:`, {
        hasMediaBase64: !!vpsBase64,
        hasInstancePhone: !!instancePhone,
        dataKeys: Object.keys(data || {}),
        bodyKeys: Object.keys(body || {})
      });
      
      if (vpsBase64 && vpsBase64.startsWith('data:')) {
        console.log(`[${requestId}] 🎯 BASE64 DA VPS DETECTADO! Tamanho: ${vpsMediaSize || 'N/A'} bytes`);
        
        // ✅ CRIAR CACHE DIRETO COM BASE64 DA VPS (SEM DOWNLOAD)
        // ✅ USAR PLACEHOLDER PEQUENO PARA original_url para evitar limite de índice PostgreSQL (8KB)
        const placeholderUrl = `base64://${messageId}`;
        
        const { data: cacheData, error: cacheError } = await supabase
          .from('media_cache')
          .upsert({
            message_id: messageDbId,
            external_message_id: messageId,
            original_url: placeholderUrl, // ✅ PLACEHOLDER pequeno para satisfazer índice
            cached_url: vpsBase64, // ✅ Base64 vai para cached_url para frontend
            base64_data: vpsBase64,
            file_size: vpsMediaSize || 0,
            media_type: messageType,
            file_name: MediaProcessor.generateFileName(messageId, messageType),
            created_at: new Date().toISOString()
          }, {
            onConflict: 'message_id',
            ignoreDuplicates: false
          })
          .select('id')
          .single();

        if (!cacheError && cacheData) {
          console.log(`[${requestId}] ✅ Cache criado direto da VPS: ${cacheData.id}`);
          finalMediaUrl = vpsBase64; // ✅ CRUCIAL: Definir Base64 como URL final
          processedMediaData = {
            cacheId: cacheData.id,
            base64Data: vpsBase64,
            fileSizeBytes: vpsMediaSize || 0,
            fileSizeMB: (vpsMediaSize || 0) / (1024 * 1024),
            storageUrl: null,
            isStorageSaved: false
          };
        } else {
          console.log(`[${requestId}] ❌ Erro ao criar cache VPS: ${cacheError?.message}`);
        }
      } else {
        // 🔄 FALLBACK: PROCESSAR MÍDIA TRADICIONALMENTE
        console.log(`[${requestId}] 🔄 Sem Base64 da VPS, processando tradicionalmente...`);
        
        // EXTRAÇÃO EXPANDIDA DE URL DA MÍDIA
        const potentialUrls = [
          data?.mediaUrl, data?.media_url, data?.media?.url, data?.url,
          body?.mediaUrl, body?.media_url, body?.media?.url, body?.url,
          body?.data?.mediaUrl, body?.data?.media_url, body?.data?.media?.url,
          body?.data?.image?.url, body?.data?.video?.url, body?.data?.audio?.url, body?.data?.document?.url,
          body?.message?.image?.url, body?.message?.video?.url, body?.message?.audio?.url, body?.message?.document?.url,
          body?.image?.url, body?.video?.url, body?.audio?.url, body?.document?.url, body?.sticker?.url
        ].filter(Boolean);
        
        console.log(`[${requestId}] 📎 URLs potenciais encontradas:`, potentialUrls);
      
              if (potentialUrls.length > 0) {
          const mediaUrl = potentialUrls[0];
          if (mediaUrl && typeof mediaUrl === 'string' && (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://'))) {
            console.log(`[${requestId}] ✅ URL válida detectada: ${mediaUrl.substring(0, 80)}...`);
            
            try {
              // ✅ CORRIGIDO: Processar mídia com messageType correto
              // ✅ NOVO PROCESSADOR DE MÍDIA
              const mediaResult = await MediaProcessor.processMediaForMessage({
                messageId: messageDbId,
                mediaUrl: mediaUrl,
                mediaType: messageType,
                externalMessageId: messageId
              });
              
              if (mediaResult.success) {
                // ✅ BUSCAR DADOS COMPLETOS DO CACHE CRIADO
                const { data: cacheData, error: cacheError } = await supabase
                  .from('media_cache')
                  .select('cached_url, base64_data, file_size')
                  .eq('id', mediaResult.cacheId!)
                  .single();

                processedMediaData = {
                  cacheId: mediaResult.cacheId!,
                  base64Data: mediaResult.base64Data || cacheData?.base64_data || '',
                  fileSizeBytes: mediaResult.fileSize || cacheData?.file_size || 0,
                  fileSizeMB: (mediaResult.fileSize || cacheData?.file_size || 0) / (1024 * 1024),
                  storageUrl: cacheData?.cached_url || undefined, // ✅ Storage URL do cache
                  isStorageSaved: !!(cacheData?.cached_url)
                };
                
                console.log(`[${requestId}] 📊 Mídia processada:`, {
                  hasBase64: !!processedMediaData.base64Data,
                  hasStorageUrl: !!processedMediaData.storageUrl,
                  fileSize: processedMediaData.fileSizeMB.toFixed(1) + 'MB'
                });
              } else {
                console.log(`[${requestId}] ⚠️ Falha no processamento: ${mediaResult.error}`);
              }
              console.log(`[${requestId}] ✅ Mídia processada com sucesso`);
              
                           // ✅ DEFINIR URL FINAL (Storage ou base64 com MIME TYPE CORRETO)
               if (processedMediaData?.storageUrl) {
                 finalMediaUrl = processedMediaData.storageUrl;
               } else if (processedMediaData?.base64Data) {
                 // 🔧 MIME TYPES CORRETOS PARA CADA TIPO DE MÍDIA
                 const mimeTypes = {
                   'image': 'image/jpeg',
                   'audio': 'audio/ogg',
                   'video': 'video/mp4',
                   'document': 'application/pdf'
                 };
                 const mimeType = mimeTypes[messageType as keyof typeof mimeTypes] || 'application/octet-stream';
                 finalMediaUrl = `data:${mimeType};base64,${processedMediaData.base64Data}`;
                 console.log(`[${requestId}] 🎯 Base64 com MIME correto: ${mimeType}`);
               }
              
            } catch (mediaError) {
              console.log(`[${requestId}] ⚠️ Erro ao processar mídia: ${mediaError.message}`);
              finalMediaUrl = mediaUrl; // Fallback para URL original
            }
          }
        }
      }
    }

    // ✅ 5. ATUALIZAR MENSAGEM COM URL FINAL DA MÍDIA E TIPO
    if (messageType !== 'text' && messageType !== 'chat' && messageDbId) {
      console.log(`[${requestId}] 🔄 Atualizando mensagem com dados de mídia...`);
      
      const updateData: any = {
        media_type: messageType
      };
      
      // Se processamos mídia com sucesso, usar URL final
      if (finalMediaUrl) {
        updateData.media_url = finalMediaUrl;
      }
      
      const { error: updateError } = await supabase
        .from('messages')
        .update(updateData)
        .eq('id', messageDbId);

      if (updateError) {
        console.log(`[${requestId}] ⚠️ Erro ao atualizar dados de mídia: ${updateError.message}`);
      } else {
        console.log(`[${requestId}] ✅ Dados de mídia atualizados na mensagem:`, updateData);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: messageDbId,
      leadId: leadId,
      mediaProcessed: !!processedMediaData,
      mediaUrl: finalMediaUrl || undefined,
      mediaCacheId: processedMediaData?.cacheId,
      requestId,
      version: 'optimized_v2'
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

// ✅ FUNÇÃO OTIMIZADA PARA PROCESSAR MÍDIA COM RELAÇÕES CORRETAS
async function processMediaToBase64Optimized(
  supabase: any, 
  messageDbId: string,      // ✅ ID da mensagem no banco
  externalMessageId: string, // ✅ external_message_id para Agente IA
  mediaUrl: string, 
  mediaType: string, 
  requestId: string
): Promise<ProcessedMediaData> {
  try {
    console.log(`[${requestId}] 🔄 Processando mídia OTIMIZADA de: ${mediaUrl.substring(0, 80)}...`);

    // 1. Download da mídia
    const response = await fetch(mediaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WhatsApp-Bot/1.0)',
        'Accept': '*/*'
      }
    });

    if (!response.ok) {
      throw new Error(`Falha no download: ${response.status} - ${response.statusText}`);
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

    // ✅ 3. TENTAR SALVAR NO STORAGE PRIMEIRO
    let storageUrl = null;
    let isStorageSaved = false;
    
    try {
      // Detectar MIME type e extensão
      const mimeMatch = mediaUrl.match(/\.(jpg|jpeg|png|gif|webp|mp4|mp3|wav|ogg|m4a|pdf|doc|docx|avi|mov|wmv)$/i);
      let contentType = 'application/octet-stream';
      let extension = 'bin';
      
      if (mimeMatch) {
        extension = mimeMatch[1].toLowerCase();
        const mimeTypes = {
          'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif', 'webp': 'image/webp',
          'mp4': 'video/mp4', 'avi': 'video/x-msvideo', 'mov': 'video/quicktime', 'wmv': 'video/x-ms-wmv',
          'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'ogg': 'audio/ogg', 'm4a': 'audio/mp4',
          'pdf': 'application/pdf', 'doc': 'application/msword', 
          'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };
        contentType = mimeTypes[extension] || contentType;
      }

      // Nome único para Storage
      const fileName = `${messageDbId}_${externalMessageId}_${Date.now()}.${extension}`;
      
      console.log(`[${requestId}] 🗄️ Salvando no Storage: ${fileName} (${contentType})`);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('whatsapp-media')
        .upload(fileName, bytes, {
          contentType: contentType,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.log(`[${requestId}] ⚠️ Storage falhou, usando base64:`, uploadError.message);
      } else {
        const { data: urlData } = supabase.storage
          .from('whatsapp-media')
          .getPublicUrl(fileName);
          
        storageUrl = urlData.publicUrl;
        isStorageSaved = true;
        console.log(`[${requestId}] ✅ Mídia salva no Storage: ${storageUrl.substring(0, 80)}...`);
      }
    } catch (storageError) {
      console.log(`[${requestId}] ⚠️ Erro no Storage:`, storageError.message);
    }

    // ✅ 4. SALVAR NO MEDIA_CACHE COM RELAÇÕES CORRETAS
    const cachePayload = {
      message_id: messageDbId,           // ✅ Relacionar com mensagem
      external_message_id: externalMessageId, // ✅ Para busca do Agente IA
             original_url: storageUrl || mediaUrl,    // ✅ URL Storage ou original
       base64_data: isStorageSaved ? undefined : base64Data, // ✅ Base64 apenas se não tem Storage
      file_name: `${externalMessageId}_${mediaType}`,
      file_size: fileSizeBytes,
      media_type: mediaType,
      created_at: new Date().toISOString()
    };

    console.log(`[${requestId}] 💾 Salvando no MEDIA_CACHE com relações:`, {
      message_id: messageDbId,
      external_message_id: externalMessageId,
      has_storage: isStorageSaved,
      has_base64: !isStorageSaved
    });

    const { data: cacheData, error: cacheError } = await supabase
      .from('media_cache')
      .insert(cachePayload)
      .select('id')
      .single();

    if (cacheError) {
      console.log(`[${requestId}] ⚠️ Erro ao salvar cache: ${cacheError.message}`);
      throw new Error(`Cache save failed: ${cacheError.message}`);
    }

    console.log(`[${requestId}] ✅ MEDIA_CACHE atualizado com ID: ${cacheData.id}`);

    return {
      cacheId: cacheData.id,
      base64Data,
      fileSizeBytes,
      fileSizeMB,
      storageUrl,
      isStorageSaved
    };

  } catch (error) {
    console.log(`[${requestId}] ❌ Erro no processamento: ${error.message}`);
    throw error;
  }
}
