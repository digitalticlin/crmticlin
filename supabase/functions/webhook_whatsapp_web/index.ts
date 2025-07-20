
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ========================================
// CONFIGURAÇÕES E CONSTANTES
// ========================================
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// ========================================
// INTERFACES E TIPOS
// ========================================
interface NormalizedMessage {
  messageId: string;
  phone: string;
  text: string;
  fromMe: boolean;
  mediaType: 'text' | 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
  mediaData?: string;
  timestamp: number;
  contactName?: string;
}

interface ProcessingResult {
  success: boolean;
  messageId?: string;
  leadId?: string;
  error?: string;
  processingTime?: number;
  mediaProcessed?: boolean;
}

// ========================================
// PAYLOAD NORMALIZER
// ========================================
class PayloadNormalizer {
  static normalize(payload: any): NormalizedMessage | null {
    const startTime = Date.now();
    console.log(`[Normalizer] 🔄 Normalizando payload:`, {
      event: payload.event,
      instanceId: payload.instanceId,
      hasData: !!payload.data,
      hasMessage: !!payload.message
    });

    try {
      // Detectar formato do payload
      if (payload.event === 'messages.upsert' && payload.data?.messages) {
        return this.normalizeMessagesUpsert(payload);
      } else if (payload.event === 'message_received' || payload.messageType) {
        return this.normalizeDirectMessage(payload);
      } else if (payload.data?.key && payload.data?.message) {
        return this.normalizeWhatsAppWebJS(payload);
      }

      console.warn(`[Normalizer] ⚠️ Formato não reconhecido`);
      return null;
    } catch (error) {
      console.error(`[Normalizer] ❌ Erro na normalização:`, error);
      return null;
    } finally {
      console.log(`[Normalizer] ⏱️ Tempo de normalização: ${Date.now() - startTime}ms`);
    }
  }

  private static normalizeMessagesUpsert(payload: any): NormalizedMessage | null {
    const message = payload.data.messages[0];
    if (!message) return null;

    const key = message.key;
    const msg = message.message;

    return {
      messageId: key.id,
      phone: this.extractPhone(key.remoteJid),
      text: this.extractText(msg),
      fromMe: key.fromMe || false,
      mediaType: this.detectMediaType(msg),
      mediaUrl: this.extractMediaUrl(msg),
      mediaData: this.extractMediaData(msg),
      timestamp: message.messageTimestamp || Date.now(),
      contactName: payload.contactName
    };
  }

  private static normalizeDirectMessage(payload: any): NormalizedMessage | null {
    return {
      messageId: payload.data?.messageId || payload.messageId || `msg_${Date.now()}`,
      phone: this.extractPhone(payload.from),
      text: payload.message?.text || payload.data?.body || payload.body || '[Mensagem]',
      fromMe: payload.fromMe || false,
      mediaType: this.mapMediaType(payload.messageType || payload.data?.messageType),
      mediaUrl: payload.mediaUrl || payload.data?.mediaUrl,
      mediaData: payload.mediaData || payload.data?.mediaData,
      timestamp: payload.timestamp || payload.data?.timestamp || Date.now(),
      contactName: payload.contactName
    };
  }

  private static normalizeWhatsAppWebJS(payload: any): NormalizedMessage | null {
    const key = payload.data.key;
    const msg = payload.data.message;

    return {
      messageId: key.id,
      phone: this.extractPhone(key.remoteJid),
      text: this.extractText(msg),
      fromMe: key.fromMe || false,
      mediaType: this.detectMediaType(msg),
      mediaUrl: this.extractMediaUrl(msg),
      mediaData: this.extractMediaData(msg),
      timestamp: payload.data.messageTimestamp || Date.now(),
      contactName: payload.contactName
    };
  }

  private static extractPhone(identifier: string): string {
    if (!identifier) return '';
    
    const cleanPhone = identifier
      .replace(/@s\.whatsapp\.net$/, '')
      .replace(/@c\.us$/, '')
      .replace(/@g\.us$/, '')
      .replace(/@newsletter$/, '');
    
    return cleanPhone;
  }

  private static extractText(message: any): string {
    if (!message) return '[Mensagem]';

    return message.conversation ||
           message.extendedTextMessage?.text ||
           message.imageMessage?.caption ||
           message.videoMessage?.caption ||
           message.documentMessage?.title ||
           message.documentMessage?.fileName ||
           this.getMediaPlaceholder(message);
  }

  private static detectMediaType(message: any): 'text' | 'image' | 'video' | 'audio' | 'document' {
    if (!message) return 'text';

    if (message.imageMessage || message.stickerMessage) return 'image';
    if (message.videoMessage) return 'video';
    if (message.audioMessage || message.pttMessage) return 'audio';
    if (message.documentMessage) return 'document';
    
    return 'text';
  }

  private static mapMediaType(type: string): 'text' | 'image' | 'video' | 'audio' | 'document' {
    const mapping: Record<string, any> = {
      'image': 'image',
      'video': 'video',
      'audio': 'audio',
      'document': 'document',
      'sticker': 'image'
    };
    
    return mapping[type] || 'text';
  }

  private static extractMediaUrl(message: any): string | undefined {
    if (message.imageMessage?.url) return message.imageMessage.url;
    if (message.videoMessage?.url) return message.videoMessage.url;
    if (message.audioMessage?.url) return message.audioMessage.url;
    if (message.documentMessage?.url) return message.documentMessage.url;
    if (message.stickerMessage?.url) return message.stickerMessage.url;
    
    return undefined;
  }

  private static extractMediaData(message: any): string | undefined {
    if (message.imageMessage?.jpegThumbnail) return message.imageMessage.jpegThumbnail;
    if (message.videoMessage?.jpegThumbnail) return message.videoMessage.jpegThumbnail;
    
    return undefined;
  }

  private static getMediaPlaceholder(message: any): string {
    if (message.imageMessage) return '📷 Imagem';
    if (message.videoMessage) return '🎥 Vídeo';
    if (message.audioMessage) return '🎵 Áudio';
    if (message.documentMessage) return '📄 Documento';
    if (message.stickerMessage) return '🎭 Sticker';
    
    return '[Mensagem]';
  }
}

// ========================================
// MEDIA PROCESSOR
// ========================================
class MediaProcessor {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  async processMedia(message: NormalizedMessage): Promise<string | null> {
    if (message.mediaType === 'text' || (!message.mediaUrl && !message.mediaData)) {
      return null;
    }

    const startTime = Date.now();
    console.log(`[Media] 📁 Processando mídia:`, {
      type: message.mediaType,
      hasUrl: !!message.mediaUrl,
      hasData: !!message.mediaData,
      messageId: message.messageId
    });

    try {
      const cached = await this.checkMediaCache(message.messageId);
      if (cached) {
        console.log(`[Media] ⚡ Cache hit para: ${message.messageId}`);
        return cached;
      }

      let finalUrl: string | null = null;

      if (message.mediaData) {
        finalUrl = await this.uploadBase64Media(message.mediaData, message.messageId, message.mediaType);
      } else if (message.mediaUrl) {
        finalUrl = await this.downloadAndUploadMedia(message.mediaUrl, message.messageId, message.mediaType);
      }

      if (finalUrl) {
        await this.saveMediaCache(message.messageId, message.mediaUrl, finalUrl, message.mediaData, message.mediaType);
      }

      console.log(`[Media] ⏱️ Mídia processada em: ${Date.now() - startTime}ms`);
      return finalUrl;

    } catch (error) {
      console.error(`[Media] ❌ Erro no processamento:`, error);
      return null;
    }
  }

  private async checkMediaCache(messageId: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('media_cache')
        .select('cached_url')
        .eq('message_id', messageId)
        .maybeSingle();

      if (error) {
        console.warn(`[Media] Cache check error:`, error);
        return null;
      }

      return data?.cached_url || null;
    } catch (error) {
      console.warn(`[Media] Cache check failed:`, error);
      return null;
    }
  }

  private async uploadBase64Media(base64Data: string, messageId: string, mediaType: string): Promise<string | null> {
    try {
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      
      const mimeType = this.getMimeType(mediaType);
      const blob = new Blob([byteArray], { type: mimeType });
      
      const fileExtension = this.getFileExtension(mediaType);
      const fileName = `${messageId}.${fileExtension}`;
      
      const { data, error } = await this.supabase.storage
        .from('whatsapp-media')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error(`[Media] Upload error:`, error);
        return null;
      }

      const { data: publicUrlData } = this.supabase.storage
        .from('whatsapp-media')
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error(`[Media] Base64 upload error:`, error);
      return null;
    }
  }

  private async downloadAndUploadMedia(url: string, messageId: string, mediaType: string): Promise<string | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.status}`);
      }

      const blob = await response.blob();
      const fileExtension = this.getFileExtension(mediaType);
      const fileName = `${messageId}.${fileExtension}`;

      const { data, error } = await this.supabase.storage
        .from('whatsapp-media')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error(`[Media] Download upload error:`, error);
        return null;
      }

      const { data: publicUrlData } = this.supabase.storage
        .from('whatsapp-media')
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error(`[Media] Download and upload error:`, error);
      return null;
    }
  }

  private async saveMediaCache(messageId: string, originalUrl: string | undefined, cachedUrl: string, base64Data: string | undefined, mediaType: string) {
    try {
      const { error } = await this.supabase
        .from('media_cache')
        .upsert({
          message_id: messageId,
          original_url: originalUrl,
          cached_url: cachedUrl,
          base64_data: base64Data,
          media_type: mediaType,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.warn(`[Media] Cache save error:`, error);
      }
    } catch (error) {
      console.warn(`[Media] Cache save failed:`, error);
    }
  }

  private getMimeType(mediaType: string): string {
    const mapping: Record<string, string> = {
      'image': 'image/jpeg',
      'video': 'video/mp4',
      'audio': 'audio/ogg',
      'document': 'application/pdf'
    };
    return mapping[mediaType] || 'application/octet-stream';
  }

  private getFileExtension(mediaType: string): string {
    const mapping: Record<string, string> = {
      'image': 'jpg',
      'video': 'mp4',
      'audio': 'ogg',
      'document': 'pdf'
    };
    return mapping[mediaType] || 'bin';
  }
}

// ========================================
// WEBHOOK PROCESSOR PRINCIPAL - VERSÃO CORRIGIDA
// ========================================
class WebhookProcessor {
  private supabase: any;
  private mediaProcessor: MediaProcessor;

  constructor() {
    this.supabase = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    this.mediaProcessor = new MediaProcessor(this.supabase);
  }

  async processWebhook(payload: any, requestId: string): Promise<ProcessingResult> {
    const startTime = Date.now();
    console.log(`[Processor] 🚀 Iniciando processamento [${requestId}]`);

    try {
      // 1. Normalizar payload
      const normalizedMessage = PayloadNormalizer.normalize(payload);
      if (!normalizedMessage) {
        return {
          success: false,
          error: 'Failed to normalize payload'
        };
      }

      console.log(`[Processor] 📝 Mensagem normalizada:`, {
        phone: `${normalizedMessage.phone.substring(0, 4)}****`,
        fromMe: normalizedMessage.fromMe,
        mediaType: normalizedMessage.mediaType,
        textLength: normalizedMessage.text.length
      });

      // 2. Tentar usar a função SQL otimizada primeiro
      console.log(`[Processor] 🔄 Tentando função SQL otimizada...`);
      let messageResult;
      
      try {
        messageResult = await this.supabase.rpc('process_whatsapp_message', {
          p_vps_instance_id: payload.instanceId || payload.instanceName,
          p_phone: normalizedMessage.phone,
          p_message_text: normalizedMessage.text,
          p_from_me: normalizedMessage.fromMe,
          p_media_type: normalizedMessage.mediaType,
          p_media_url: null,
          p_external_message_id: normalizedMessage.messageId,
          p_contact_name: normalizedMessage.contactName
        });

        console.log(`[Processor] 🎯 Resultado da função SQL:`, {
          success: messageResult.data?.success,
          error: messageResult.error,
          data: messageResult.data?.data
        });

        // Se a função SQL falhou, usar método direto
        if (!messageResult.data?.success || messageResult.error) {
          console.log(`[Processor] ⚠️ Função SQL falhou, usando método direto...`);
          messageResult = await this.processMessageDirect(payload, normalizedMessage);
        }

      } catch (rpcError) {
        console.error(`[Processor] ❌ RPC Error:`, rpcError);
        console.log(`[Processor] 🔄 Fallback para método direto...`);
        messageResult = await this.processMessageDirect(payload, normalizedMessage);
      }

      if (!messageResult.success) {
        return {
          success: false,
          error: messageResult.error || 'Database processing failed'
        };
      }

      // 3. Processar mídia em paralelo
      const mediaProcessingPromise = normalizedMessage.mediaType !== 'text' 
        ? this.mediaProcessor.processMedia(normalizedMessage)
        : Promise.resolve(null);

      // 4. Aguardar processamento de mídia e atualizar se necessário
      const mediaUrl = await mediaProcessingPromise;
      if (mediaUrl && messageResult.data?.message_id) {
        await this.updateMessageMediaUrl(messageResult.data.message_id, mediaUrl);
      }

      const processingTime = Date.now() - startTime;
      console.log(`[Processor] ✅ Processamento concluído em: ${processingTime}ms`);

      return {
        success: true,
        messageId: messageResult.data?.message_id,
        leadId: messageResult.data?.lead_id,
        processingTime,
        mediaProcessed: !!mediaUrl
      };

    } catch (error) {
      console.error(`[Processor] ❌ Erro no processamento:`, error);
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime
      };
    }
  }

  // MÉTODO DIRETO COMO FALLBACK
  private async processMessageDirect(payload: any, normalizedMessage: NormalizedMessage): Promise<any> {
    console.log(`[Processor] 🔧 Processamento direto iniciado`);
    
    try {
      // 1. Buscar instância
      const instanceId = payload.instanceId || payload.instanceName;
      const { data: instance, error: instanceError } = await this.supabase
        .from('whatsapp_instances')
        .select('id, created_by_user_id')
        .eq('vps_instance_id', instanceId)
        .maybeSingle();

      if (instanceError || !instance) {
        console.error(`[Processor] ❌ Instância não encontrada:`, instanceError);
        return {
          success: false,
          error: 'Instance not found'
        };
      }

      console.log(`[Processor] ✅ Instância encontrada:`, instance.id);

      // 2. Formatar telefone
      const formattedPhone = this.formatPhone(normalizedMessage.phone);
      const formattedName = normalizedMessage.contactName || `Contato ${formattedPhone}`;

      // 3. Buscar ou criar lead
      const { data: existingLead } = await this.supabase
        .from('leads')
        .select('id')
        .eq('phone', formattedPhone)
        .eq('created_by_user_id', instance.created_by_user_id)
        .maybeSingle();

      let leadId = existingLead?.id;

      if (!leadId) {
        // Buscar funil padrão
        const { data: funnel } = await this.supabase
          .from('funnels')
          .select('id')
          .eq('created_by_user_id', instance.created_by_user_id)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        // Buscar primeiro estágio
        const { data: stage } = await this.supabase
          .from('kanban_stages')
          .select('id')
          .eq('funnel_id', funnel?.id)
          .order('order_position', { ascending: true })
          .limit(1)
          .maybeSingle();

        // Criar novo lead
        const { data: newLead, error: leadError } = await this.supabase
          .from('leads')
          .insert({
            phone: formattedPhone,
            name: formattedName,
            whatsapp_number_id: instance.id,
            created_by_user_id: instance.created_by_user_id,
            funnel_id: funnel?.id,
            kanban_stage_id: stage?.id,
            last_message_time: new Date().toISOString(),
            import_source: 'realtime'
          })
          .select('id')
          .single();

        if (leadError) {
          console.error(`[Processor] ❌ Erro ao criar lead:`, leadError);
          return {
            success: false,
            error: 'Failed to create lead'
          };
        }

        leadId = newLead.id;
        console.log(`[Processor] ✅ Lead criado:`, leadId);
      } else {
        // Atualizar lead existente
        await this.supabase
          .from('leads')
          .update({
            whatsapp_number_id: instance.id,
            last_message_time: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', leadId);

        console.log(`[Processor] ✅ Lead atualizado:`, leadId);
      }

      // 4. Inserir mensagem
      const { data: message, error: messageError } = await this.supabase
        .from('messages')
        .insert({
          lead_id: leadId,
          whatsapp_number_id: instance.id,
          text: normalizedMessage.text,
          from_me: normalizedMessage.fromMe,
          timestamp: new Date().toISOString(),
          status: normalizedMessage.fromMe ? 'sent' : 'received',
          created_by_user_id: instance.created_by_user_id,
          media_type: normalizedMessage.mediaType,
          import_source: 'realtime',
          external_message_id: normalizedMessage.messageId
        })
        .select('id')
        .single();

      if (messageError) {
        console.error(`[Processor] ❌ Erro ao inserir mensagem:`, messageError);
        return {
          success: false,
          error: 'Failed to insert message'
        };
      }

      console.log(`[Processor] ✅ Mensagem inserida:`, message.id);

      // 5. Atualizar contador de não lidas
      if (!normalizedMessage.fromMe) {
        await this.supabase
          .from('leads')
          .update({
            unread_count: this.supabase.rpc('increment_unread_count', { lead_id: leadId }),
            last_message: normalizedMessage.text
          })
          .eq('id', leadId);
      }

      return {
        success: true,
        data: {
          message_id: message.id,
          lead_id: leadId,
          instance_id: instance.id,
          user_id: instance.created_by_user_id
        }
      };

    } catch (error) {
      console.error(`[Processor] ❌ Erro no processamento direto:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  private formatPhone(phone: string): string {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    
    if (cleanPhone.startsWith('55') && cleanPhone.length === 13) {
      const ddd = cleanPhone.substring(2, 4);
      const number = cleanPhone.substring(4);
      return `+55 (${ddd}) ${number.substring(0, 5)}-${number.substring(5)}`;
    } else if (cleanPhone.length === 11) {
      const ddd = cleanPhone.substring(0, 2);
      const number = cleanPhone.substring(2);
      return `+55 (${ddd}) ${number.substring(0, 5)}-${number.substring(5)}`;
    } else if (cleanPhone.length === 10) {
      const ddd = cleanPhone.substring(0, 2);
      const number = cleanPhone.substring(2);
      return `+55 (${ddd}) 9${number.substring(0, 4)}-${number.substring(4)}`;
    }
    
    return `+55 ${cleanPhone}`;
  }

  private async updateMessageMediaUrl(messageId: string, mediaUrl: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('messages')
        .update({ media_url: mediaUrl })
        .eq('id', messageId);

      if (error) {
        console.warn(`[Processor] Failed to update media URL:`, error);
      } else {
        console.log(`[Processor] ✅ Media URL updated for message: ${messageId}`);
      }
    } catch (error) {
      console.warn(`[Processor] Media URL update error:`, error);
    }
  }
}

// ========================================
// SERVIDOR PRINCIPAL
// ========================================
serve(async (req) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  console.log(`[Main] 🚀 WEBHOOK V3.0 - CORRIGIDO [${requestId}]`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    console.log(`[Main] ❌ Método não permitido: ${req.method}`);
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const payload = await req.json();
    console.log(`[Main] 📥 Payload recebido [${requestId}]:`, {
      event: payload.event,
      instanceId: payload.instanceId || payload.instanceName,
      hasData: !!payload.data,
      hasMessage: !!payload.message
    });
    
    // Validação básica
    const instanceId = payload.instanceId || payload.instanceName;
    if (!instanceId) {
      console.error(`[Main] ❌ instanceId não fornecido`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'instanceId é obrigatório',
        requestId
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Processar apenas mensagens relevantes
    const relevantEvents = ['messages.upsert', 'message_received'];
    const eventType = payload.event || payload.type;
    
    if (!relevantEvents.includes(eventType) && !payload.messageType) {
      console.log(`[Main] ⏭️ Evento ignorado: ${eventType}`);
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Evento ignorado',
        event: eventType,
        requestId
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Processar webhook
    const processor = new WebhookProcessor();
    const result = await processor.processWebhook(payload, requestId);

    if (result.success) {
      console.log(`[Main] ✅ Sucesso [${requestId}]:`, {
        messageId: result.messageId,
        leadId: result.leadId,
        processingTime: result.processingTime,
        mediaProcessed: result.mediaProcessed
      });
    } else {
      console.error(`[Main] ❌ Falha [${requestId}]:`, result.error);
    }

    return new Response(JSON.stringify({ 
      ...result,
      requestId
    }), {
      status: result.success ? 200 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[Main] ❌ ERRO FATAL [${requestId}]:`, error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      requestId
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
