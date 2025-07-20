

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
  strategy?: string;
  strategyAttempts?: string[];
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
// VALIDADOR DE TELEFONES
// ========================================
class PhoneValidator {
  static isValidPhone(phone: string): boolean {
    if (!phone) return false;
    
    // Remover caracteres não numéricos
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    
    // Verificações específicas para filtrar grupos e IDs inválidos
    
    // 1. Muito longo (IDs de grupo podem ter 15+ dígitos)
    if (cleanPhone.length > 15) {
      console.log(`[PhoneValidator] ❌ Telefone muito longo: ${cleanPhone.length} dígitos`);
      return false;
    }
    
    // 2. Muito curto
    if (cleanPhone.length < 10) {
      console.log(`[PhoneValidator] ❌ Telefone muito curto: ${cleanPhone.length} dígitos`);
      return false;
    }
    
    // 3. Padrões específicos de grupos (começam com números específicos)
    if (cleanPhone.startsWith('120') && cleanPhone.length > 13) {
      console.log(`[PhoneValidator] ❌ Identificador de grupo detectado: ${cleanPhone.substring(0, 6)}...`);
      return false;
    }
    
    // 4. Apenas dígitos repetidos (IDs inválidos)
    if (/^(\d)\1+$/.test(cleanPhone)) {
      console.log(`[PhoneValidator] ❌ Número com dígitos repetidos: ${cleanPhone}`);
      return false;
    }
    
    // 5. Padrões brasileiros válidos
    if (cleanPhone.startsWith('55')) {
      // Formato brasileiro: 55 + DDD + número
      return cleanPhone.length >= 12 && cleanPhone.length <= 13;
    }
    
    // 6. Números internacionais válidos (10-14 dígitos)
    return cleanPhone.length >= 10 && cleanPhone.length <= 14;
  }
  
  static getPhoneInfo(phone: string): { clean: string; valid: boolean; type: string } {
    const clean = phone.replace(/[^0-9]/g, '');
    const valid = this.isValidPhone(phone);
    
    let type = 'unknown';
    
    if (!valid) {
      if (clean.startsWith('120')) type = 'group';
      else if (clean.length > 15) type = 'invalid_long';
      else if (clean.length < 10) type = 'invalid_short';
      else type = 'invalid_pattern';
    } else {
      if (clean.startsWith('55')) type = 'brazil';
      else type = 'international';
    }
    
    return { clean, valid, type };
  }
}

// ========================================
// MESSAGE INSERTION STRATEGIES - V4.2 ULTRA ROBUSTO
// ========================================
class MessageInsertionManager {
  private supabase: any;
  private supabaseServiceRole: any;

  constructor() {
    this.supabase = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    
    // Client específico com service role explícito
    this.supabaseServiceRole = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: 'public' },
      global: { headers: { 'apikey': supabaseServiceKey! } }
    });
  }

  async insertMessage(leadId: string, instanceId: string, message: NormalizedMessage, userId: string): Promise<ProcessingResult> {
    const strategies = [
      'rpc_dedicated_function',
      'service_role_direct', 
      'standard_client_explicit',
      'raw_rpc_fallback'
    ];

    const attemptResults: string[] = [];
    
    console.log(`[MessageManager] 🚀 Iniciando inserção com ${strategies.length} estratégias disponíveis`);

    for (const strategy of strategies) {
      console.log(`[MessageManager] 🎯 Tentando estratégia: ${strategy}`);
      
      try {
        const result = await this.executeStrategy(strategy, leadId, instanceId, message, userId);
        
        if (result.success) {
          console.log(`[MessageManager] ✅ SUCESSO com estratégia: ${strategy}`);
          attemptResults.push(`${strategy}: SUCCESS`);
          
          return {
            success: true,
            messageId: result.messageId,
            strategy: strategy,
            strategyAttempts: attemptResults
          };
        } else {
          console.log(`[MessageManager] ❌ Falha na estratégia ${strategy}:`, result.error);
          attemptResults.push(`${strategy}: FAILED - ${result.error}`);
        }
      } catch (error) {
        console.error(`[MessageManager] ❌ Erro na estratégia ${strategy}:`, error);
        attemptResults.push(`${strategy}: ERROR - ${error.message}`);
      }
    }

    console.error(`[MessageManager] ❌ TODAS AS ESTRATÉGIAS FALHARAM`);
    return {
      success: false,
      error: 'All message insertion strategies failed',
      strategyAttempts: attemptResults
    };
  }

  private async executeStrategy(strategy: string, leadId: string, instanceId: string, message: NormalizedMessage, userId: string) {
    switch (strategy) {
      case 'rpc_dedicated_function':
        return await this.strategyRPCDedicated(leadId, instanceId, message, userId);
      
      case 'service_role_direct':
        return await this.strategyServiceRoleDirect(leadId, instanceId, message, userId);
      
      case 'standard_client_explicit':
        return await this.strategyStandardClientExplicit(leadId, instanceId, message, userId);
      
      case 'raw_rpc_fallback':
        return await this.strategyRawRPCFallback(leadId, instanceId, message, userId);
      
      default:
        throw new Error(`Unknown strategy: ${strategy}`);
    }
  }

  // ESTRATÉGIA 1: RPC com função SQL dedicada
  private async strategyRPCDedicated(leadId: string, instanceId: string, message: NormalizedMessage, userId: string) {
    console.log(`[Strategy-RPC] 🎯 Usando função SQL dedicada para inserção`);
    
    const { data, error } = await this.supabase.rpc('insert_message_safe', {
      p_lead_id: leadId,
      p_instance_id: instanceId,
      p_message_text: message.text,
      p_from_me: message.fromMe,
      p_user_id: userId,
      p_media_type: message.mediaType,
      p_media_url: message.mediaUrl,
      p_external_message_id: message.messageId
    });

    if (error) {
      console.error(`[Strategy-RPC] ❌ Erro na função SQL:`, error);
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      console.error(`[Strategy-RPC] ❌ Função SQL retornou falha:`, data);
      return { success: false, error: data?.error || 'SQL function failed' };
    }

    console.log(`[Strategy-RPC] ✅ Sucesso via função SQL:`, data.message_id);
    return { success: true, messageId: data.message_id };
  }

  // ESTRATÉGIA 2: Client service role direto
  private async strategyServiceRoleDirect(leadId: string, instanceId: string, message: NormalizedMessage, userId: string) {
    console.log(`[Strategy-ServiceRole] 🎯 Usando client service role direto`);
    
    const { data, error } = await this.supabaseServiceRole
      .from('messages')
      .insert({
        lead_id: leadId,
        whatsapp_number_id: instanceId,
        text: message.text,
        from_me: message.fromMe,
        timestamp: new Date().toISOString(),
        status: message.fromMe ? 'sent' : 'received',
        created_by_user_id: userId,
        media_type: message.mediaType,
        media_url: message.mediaUrl,
        import_source: 'realtime',
        external_message_id: message.messageId
      })
      .select('id')
      .single();

    if (error) {
      console.error(`[Strategy-ServiceRole] ❌ Erro:`, error);
      return { success: false, error: error.message };
    }

    console.log(`[Strategy-ServiceRole] ✅ Sucesso:`, data.id);
    return { success: true, messageId: data.id };
  }

  // ESTRATÉGIA 3: Client padrão com schema explícito
  private async strategyStandardClientExplicit(leadId: string, instanceId: string, message: NormalizedMessage, userId: string) {
    console.log(`[Strategy-Standard] 🎯 Usando client padrão com schema explícito`);
    
    const { data, error } = await this.supabase
      .schema('public')
      .from('messages')
      .insert({
        lead_id: leadId,
        whatsapp_number_id: instanceId,
        text: message.text,
        from_me: message.fromMe,
        timestamp: new Date().toISOString(),
        status: message.fromMe ? 'sent' : 'received',
        created_by_user_id: userId,
        media_type: message.mediaType,
        media_url: message.mediaUrl,
        import_source: 'realtime',
        external_message_id: message.messageId
      })
      .select('id')
      .single();

    if (error) {
      console.error(`[Strategy-Standard] ❌ Erro:`, error);
      return { success: false, error: error.message };
    }

    console.log(`[Strategy-Standard] ✅ Sucesso:`, data.id);
    return { success: true, messageId: data.id };
  }

  // ESTRATÉGIA 4: RPC raw como último recurso
  private async strategyRawRPCFallback(leadId: string, instanceId: string, message: NormalizedMessage, userId: string) {
    console.log(`[Strategy-RawRPC] 🎯 Usando RPC raw como último recurso`);
    
    // Usar a função insert_whatsapp_message_safe existente como fallback
    const { data, error } = await this.supabase.rpc('process_whatsapp_message', {
      p_vps_instance_id: 'fallback_instance',
      p_phone: 'fallback_phone',
      p_message_text: message.text,
      p_from_me: message.fromMe,
      p_media_type: message.mediaType,
      p_media_url: message.mediaUrl,
      p_external_message_id: message.messageId,
      p_contact_name: 'Fallback Contact'
    });

    if (error) {
      console.error(`[Strategy-RawRPC] ❌ Erro:`, error);
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      console.error(`[Strategy-RawRPC] ❌ Função retornou falha:`, data);
      return { success: false, error: data?.error || 'Raw RPC failed' };
    }

    console.log(`[Strategy-RawRPC] ✅ Sucesso via RPC raw:`, data.data?.message_id);
    return { success: true, messageId: data.data?.message_id };
  }
}

// ========================================
// WEBHOOK PROCESSOR V4.2 - ULTRA ROBUSTO
// ========================================
class WebhookProcessor {
  private supabase: any;
  private messageManager: MessageInsertionManager;

  constructor() {
    this.supabase = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    this.messageManager = new MessageInsertionManager();
  }

  async processWebhook(payload: any, requestId: string): Promise<ProcessingResult> {
    const startTime = Date.now();
    console.log(`[Processor] 🚀 Iniciando processamento V4.2 [${requestId}] - ESTRATÉGIAS MÚLTIPLAS`);

    try {
      // 1. Normalizar payload
      const normalizedMessage = PayloadNormalizer.normalize(payload);
      if (!normalizedMessage) {
        return {
          success: false,
          error: 'Failed to normalize payload'
        };
      }

      // 2. Validar telefone
      const phoneInfo = PhoneValidator.getPhoneInfo(normalizedMessage.phone);
      
      console.log(`[Processor] 📞 Análise do telefone:`, {
        original: normalizedMessage.phone.substring(0, 6) + '****',
        clean: phoneInfo.clean.substring(0, 6) + '****',
        valid: phoneInfo.valid,
        type: phoneInfo.type,
        length: phoneInfo.clean.length
      });

      if (!phoneInfo.valid) {
        console.log(`[Processor] ⏭️ Ignorando mensagem de telefone inválido:`, {
          type: phoneInfo.type,
          reason: phoneInfo.type === 'group' ? 'Grupo do WhatsApp' : 'Formato inválido'
        });
        
        return {
          success: true,
          error: `Ignored: ${phoneInfo.type}`,
          processingTime: Date.now() - startTime
        };
      }

      console.log(`[Processor] ✅ Telefone válido confirmado: ${phoneInfo.type}`);

      // 3. Processamento V4.2 com estratégias múltiplas
      console.log(`[Processor] 🔧 Processamento V4.2 iniciado - ESTRATÉGIAS MÚLTIPLAS`);
      
      const instanceId = payload.instanceId || payload.instanceName;
      const result = await this.processV42MultiStrategy(instanceId, normalizedMessage);

      const processingTime = Date.now() - startTime;
      console.log(`[Processor] ✅ Processamento V4.2 concluído em: ${processingTime}ms`);

      return {
        success: result.success,
        messageId: result.messageId,
        leadId: result.leadId,
        processingTime,
        strategy: result.strategy,
        strategyAttempts: result.strategyAttempts,
        error: result.error
      };

    } catch (error) {
      console.error(`[Processor] ❌ Erro no processamento V4.2:`, error);
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime
      };
    }
  }

  private async processV42MultiStrategy(instanceId: string, message: NormalizedMessage) {
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
        // Lead não existe - criar através da função SQL
        console.log(`[Processor] ➕ Criando novo lead via função SQL`);
        
        const { data: functionResult, error: functionError } = await this.supabase
          .rpc('insert_whatsapp_message_safe', {
            p_vps_instance_id: instanceId,
            p_phone: message.phone,
            p_message_text: message.text,
            p_from_me: message.fromMe,
            p_media_type: message.mediaType,
            p_media_url: message.mediaUrl,
            p_external_message_id: message.messageId,
            p_contact_name: message.contactName
          });

        if (functionError || !functionResult?.success) {
          console.error(`[Processor] ❌ Erro na função SQL:`, functionError || functionResult);
          return { 
            success: false, 
            error: functionResult?.error || functionError?.message || 'SQL function failed' 
          };
        }

        console.log(`[Processor] ✅ Lead e mensagem criados via função SQL:`, {
          leadId: functionResult.data.lead_id,
          messageId: functionResult.data.message_id
        });

        return {
          success: true,
          messageId: functionResult.data.message_id,
          leadId: functionResult.data.lead_id,
          strategy: 'sql_function_complete'
        };
      }

      // 4. INSERIR MENSAGEM COM ESTRATÉGIAS MÚLTIPLAS V4.2
      console.log(`[Processor] 💬 Inserindo mensagem V4.2 com estratégias múltiplas para lead: ${leadId}`);
      
      const messageResult = await this.messageManager.insertMessage(
        leadId, 
        instance.id, 
        message, 
        instance.created_by_user_id
      );

      if (!messageResult.success) {
        console.error(`[Processor] ❌ TODAS as estratégias de mensagem falharam:`, messageResult);
        return { 
          success: false, 
          error: 'All message insertion strategies failed',
          strategyAttempts: messageResult.strategyAttempts
        };
      }

      console.log(`[Processor] ✅ Mensagem inserida com sucesso via estratégia: ${messageResult.strategy}`);
      console.log(`[Processor] 📊 Tentativas de estratégias:`, messageResult.strategyAttempts);

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
        messageId: messageResult.messageId,
        leadId: leadId,
        strategy: messageResult.strategy,
        strategyAttempts: messageResult.strategyAttempts
      };

    } catch (error) {
      console.error(`[Processor] ❌ Erro no processamento V4.2:`, error);
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
  
  console.log(`[Main] 🚀 WEBHOOK V4.2 - ESTRATÉGIAS MÚLTIPLAS DE INSERÇÃO [${requestId}]`);
  
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

    // Processar webhook V4.2
    const processor = new WebhookProcessor();
    const result = await processor.processWebhook(payload, requestId);

    if (result.success) {
      console.log(`[Main] ✅ Sucesso V4.2 [${requestId}]:`, {
        messageId: result.messageId,
        leadId: result.leadId,
        processingTime: result.processingTime,
        strategy: result.strategy,
        strategyAttempts: result.strategyAttempts?.length || 0
      });
    } else {
      console.error(`[Main] ❌ Falha V4.2 [${requestId}]:`, {
        error: result.error,
        strategyAttempts: result.strategyAttempts
      });
    }

    return new Response(JSON.stringify({ 
      ...result,
      requestId,
      version: 'V4.2-MULTIPLE-STRATEGIES'
    }), {
      status: result.success ? 200 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[Main] ❌ ERRO FATAL V4.2 [${requestId}]:`, error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      requestId,
      version: 'V4.2-MULTIPLE-STRATEGIES'
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
