
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
// WEBHOOK PROCESSOR V4 - CONFIGURAÇÃO ANTERIOR FUNCIONAL
// ========================================
class WebhookProcessor {
  private supabase: any;

  constructor() {
    this.supabase = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }

  async processWebhook(payload: any, requestId: string): Promise<ProcessingResult> {
    const startTime = Date.now();
    console.log(`[Processor] 🚀 Iniciando processamento V4 [${requestId}]`);

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

      // 2. Processamento direto V4
      console.log(`[Processor] 🔧 Processamento direto V4 iniciado`);
      
      const instanceId = payload.instanceId || payload.instanceName;
      const result = await this.processDirectV4(instanceId, normalizedMessage);

      const processingTime = Date.now() - startTime;
      console.log(`[Processor] ✅ Processamento V4 concluído em: ${processingTime}ms`);

      return {
        success: result.success,
        messageId: result.messageId,
        leadId: result.leadId,
        processingTime,
        error: result.error
      };

    } catch (error) {
      console.error(`[Processor] ❌ Erro no processamento V4:`, error);
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime
      };
    }
  }

  private async processDirectV4(instanceId: string, message: NormalizedMessage) {
    try {
      // 1. Buscar instância
      const { data: instance, error: instanceError } = await this.supabase
        .from('whatsapp_instances')
        .select('id, created_by_user_id')
        .eq('vps_instance_id', instanceId)
        .single();

      if (instanceError || !instance) {
        console.error(`[Processor] ❌ Instância não encontrada:`, instanceError);
        return { success: false, error: 'Instance not found' };
      }

      console.log(`[Processor] ✅ Instância encontrada: ${instance.id}`);

      // 2. Formatar telefone
      const formattedPhone = this.formatBrazilianPhone(message.phone);
      console.log(`[Processor] 📞 Telefone formatado: ${formattedPhone.substring(0, 8)}****`);

      // 3. Buscar lead existente
      const { data: existingLead, error: leadError } = await this.supabase
        .from('leads')
        .select('id')
        .eq('phone', formattedPhone)
        .eq('created_by_user_id', instance.created_by_user_id)
        .single();

      let leadId: string;

      if (existingLead && !leadError) {
        // Lead existe - atualizar
        console.log(`[Processor] 🔄 Lead existente encontrado: ${existingLead.id}`);
        
        const { error: updateError } = await this.supabase
          .from('leads')
          .update({
            whatsapp_number_id: instance.id,
            last_message_time: new Date().toISOString(),
            last_message: message.text,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingLead.id);

        if (updateError) {
          console.error(`[Processor] ❌ Erro ao atualizar lead:`, updateError);
          return { success: false, error: 'Failed to update lead' };
        }

        leadId = existingLead.id;
        console.log(`[Processor] ✅ Lead atualizado: ${leadId}`);
      } else {
        // Lead não existe - criar novo
        console.log(`[Processor] ➕ Criando novo lead`);
        
        // Buscar funil padrão
        const { data: funnel } = await this.supabase
          .from('funnels')
          .select('id')
          .eq('created_by_user_id', instance.created_by_user_id)
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        // Buscar primeiro estágio
        const { data: stage } = await this.supabase
          .from('kanban_stages')
          .select('id')
          .eq('funnel_id', funnel?.id)
          .order('order_position', { ascending: true })
          .limit(1)
          .single();

        const { data: newLead, error: createError } = await this.supabase
          .from('leads')
          .insert({
            phone: formattedPhone,
            name: message.contactName || `Contato ${formattedPhone}`,
            whatsapp_number_id: instance.id,
            created_by_user_id: instance.created_by_user_id,
            funnel_id: funnel?.id,
            kanban_stage_id: stage?.id,
            last_message_time: new Date().toISOString(),
            last_message: message.text,
            import_source: 'realtime'
          })
          .select('id')
          .single();

        if (createError || !newLead) {
          console.error(`[Processor] ❌ Erro ao criar lead:`, createError);
          return { success: false, error: 'Failed to create lead' };
        }

        leadId = newLead.id;
        console.log(`[Processor] ✅ Novo lead criado: ${leadId}`);
      }

      // 4. Inserir mensagem
      console.log(`[Processor] 💬 Inserindo mensagem para lead: ${leadId}`);
      
      const { data: messageData, error: messageError } = await this.supabase
        .from('messages')
        .insert({
          lead_id: leadId,
          whatsapp_number_id: instance.id,
          text: message.text,
          from_me: message.fromMe,
          timestamp: new Date().toISOString(),
          status: message.fromMe ? 'sent' : 'received',
          created_by_user_id: instance.created_by_user_id,
          media_type: message.mediaType,
          media_url: message.mediaUrl,
          import_source: 'realtime',
          external_message_id: message.messageId
        })
        .select('id')
        .single();

      if (messageError) {
        console.error(`[Processor] ❌ Erro ao inserir mensagem:`, messageError);
        return { success: false, error: 'Message insertion failed' };
      }

      console.log(`[Processor] ✅ Mensagem inserida: ${messageData.id}`);

      // 5. Atualizar contador não lidas
      if (!message.fromMe) {
        await this.supabase
          .from('leads')
          .update({
            unread_count: this.supabase.sql`COALESCE(unread_count, 0) + 1`
          })
          .eq('id', leadId);
      }

      return {
        success: true,
        messageId: messageData.id,
        leadId: leadId
      };

    } catch (error) {
      console.error(`[Processor] ❌ Erro no processamento direto:`, error);
      return { success: false, error: error.message };
    }
  }

  private formatBrazilianPhone(phone: string): string {
    if (!phone) return '';
    
    // Se já tem +55, manter
    if (phone.startsWith('+55')) return phone;
    
    const digitsOnly = phone.replace(/[^0-9]/g, '');
    
    // Diferentes formatos baseados na quantidade de dígitos
    switch (digitsOnly.length) {
      case 13: // 5511999999999
        if (digitsOnly.startsWith('55')) {
          return `+55 (${digitsOnly.substring(2, 4)}) ${digitsOnly.substring(4, 9)}-${digitsOnly.substring(9)}`;
        }
        break;
      case 11: // 11999999999  
        return `+55 (${digitsOnly.substring(0, 2)}) ${digitsOnly.substring(2, 7)}-${digitsOnly.substring(7)}`;
      case 10: // 1199999999 (adicionar 9)
        return `+55 (${digitsOnly.substring(0, 2)}) 9${digitsOnly.substring(2, 6)}-${digitsOnly.substring(6)}`;
    }
    
    return `+55 ${digitsOnly}`;
  }
}

// ========================================
// SERVIDOR PRINCIPAL
// ========================================
serve(async (req) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  console.log(`[Main] 🚀 WEBHOOK V4.0 - SERVICE ROLE CORRIGIDO [${requestId}]`);
  
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
      console.log(`[Main] ✅ Sucesso V4 [${requestId}]:`, {
        messageId: result.messageId,
        leadId: result.leadId,
        processingTime: result.processingTime
      });
    } else {
      console.error(`[Main] ❌ Falha V4 [${requestId}]:`, result.error);
    }

    return new Response(JSON.stringify({ 
      ...result,
      requestId,
      version: 'V4.0-SERVICE-ROLE'
    }), {
      status: result.success ? 200 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[Main] ❌ ERRO FATAL V4 [${requestId}]:`, error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      requestId,
      version: 'V4.0-SERVICE-ROLE'
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
