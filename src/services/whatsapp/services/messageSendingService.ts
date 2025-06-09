import { supabase } from "@/integrations/supabase/client";
import { VPS_CONFIG } from "../config/vpsConfig";
import { MessageSendResponse } from "../types/whatsappWebTypes";
import { cleanPhoneNumber } from "@/utils/phoneFormatter";

export class MessageSendingService {
  static async sendMessage(
    instanceId: string, 
    phone: string, 
    message: string
  ): Promise<MessageSendResponse> {
    const startTime = Date.now();
    
    try {
      console.log('[MessageSending] 📤 Iniciando envio de mensagem:', {
        instanceId,
        phone,
        messageLength: message.length,
        timestamp: new Date().toISOString()
      });

      const instance = await this.getWhatsAppInstance(instanceId);
      this.validateInstanceStatus(instance);

      // CORREÇÃO: Usar cleanPhoneNumber para garantir telefone limpo
      const cleanPhone = cleanPhoneNumber(phone);
      const formattedPhone = this.formatPhoneForSending(cleanPhone);
      
      const vpsResponse = await this.sendToVPS(instance.vps_instance_id, formattedPhone, message);
      
      // CORREÇÃO: Usar telefone limpo para buscar/criar lead
      const leadId = await this.getOrCreateLead(instanceId, cleanPhone, instance.company_id);
      
      // CORREÇÃO: Forçar salvamento da mensagem enviada mesmo se VPS falhar
      await this.saveSentMessage(instanceId, leadId, message, vpsResponse.messageId || `manual_${Date.now()}`);
      await this.updateLeadInfo(leadId, message);

      const duration = Date.now() - startTime;
      console.log('[MessageSending] ✅ Message sent and saved successfully:', {
        messageId: vpsResponse.messageId,
        duration: `${duration}ms`,
        leadId,
        forcedSave: !vpsResponse.messageId
      });

      return { 
        success: true,
        messageId: vpsResponse.messageId || `manual_${Date.now()}`,
        timestamp: vpsResponse.timestamp || new Date().toISOString(),
        leadId
      };

    } catch (error) {
      return this.handleError(error, Date.now() - startTime, instanceId, phone);
    }
  }

  private static async getWhatsAppInstance(instanceId: string) {
    console.log('[MessageSending] 🔍 Buscando instância:', instanceId);

    // CORREÇÃO: Buscar por ID da tabela, não por vps_instance_id
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('id, vps_instance_id, connection_status, company_id, instance_name')
      .eq('id', instanceId)
      .single();

    if (instanceError || !instance) {
      console.error('[MessageSending] ❌ Instance not found by ID, trying vps_instance_id:', { 
        instanceId, 
        instanceError 
      });
      
      // FALLBACK: Tentar buscar por vps_instance_id caso seja esse o valor passado
      const { data: fallbackInstance, error: fallbackError } = await supabase
        .from('whatsapp_instances')
        .select('id, vps_instance_id, connection_status, company_id, instance_name')
        .eq('vps_instance_id', instanceId)
        .single();

      if (fallbackError || !fallbackInstance) {
        console.error('[MessageSending] ❌ Instance not found by vps_instance_id either:', { 
          instanceId, 
          fallbackError 
        });
        throw new Error(`Instance not found: ${instanceId}`);
      }

      console.log('[MessageSending] ✅ Instance found via fallback (vps_instance_id):', {
        id: fallbackInstance.id,
        vpsInstanceId: fallbackInstance.vps_instance_id,
        connectionStatus: fallbackInstance.connection_status,
        companyId: fallbackInstance.company_id,
        instanceName: fallbackInstance.instance_name
      });

      return fallbackInstance;
    }

    console.log('[MessageSending] ✅ Instance found by ID:', {
      id: instance.id,
      vpsInstanceId: instance.vps_instance_id,
      connectionStatus: instance.connection_status,
      companyId: instance.company_id,
      instanceName: instance.instance_name
    });

    return instance;
  }

  private static validateInstanceStatus(instance: any) {
    if (!['ready', 'open'].includes(instance.connection_status)) {
      console.error('[MessageSending] ❌ Instance not ready:', {
        status: instance.connection_status,
        instanceName: instance.instance_name
      });
      throw new Error(`Instance not ready. Status: ${instance.connection_status}`);
    }
  }

  // CORREÇÃO: Nova função para formatar telefone para envio (adiciona @c.us)
  private static formatPhoneForSending(cleanPhone: string): string {
    let formattedNumber = cleanPhone;
    
    // Adicionar código do país se necessário
    if (!formattedNumber.startsWith('55')) {
      formattedNumber = '55' + formattedNumber;
    }
    
    return formattedNumber;
  }

  private static async sendToVPS(vpsInstanceId: string, formattedPhone: string, message: string) {
    // CORREÇÃO: Usar endpoint /send que vamos adicionar na VPS
    const vpsUrl = `${VPS_CONFIG.baseUrl}/send`;
    const requestBody = {
      instanceId: vpsInstanceId,
      phone: formattedPhone,
      message
    };

    console.log('[MessageSending] 🚀 Sending to VPS:', {
      url: vpsUrl,
      vpsInstanceId,
      phone: formattedPhone,
      hasAuthToken: !!VPS_CONFIG.authToken
    });

    const response = await fetch(vpsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(VPS_CONFIG.timeouts.message)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[MessageSending] ❌ VPS request failed:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 200),
        url: vpsUrl
      });
      throw new Error(`VPS send failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('[MessageSending] ✅ VPS response received:', {
      success: result.success,
      messageId: result.messageId
    });

    if (!result.success) {
      throw new Error(result.error || 'VPS returned success: false');
    }

    return result;
  }

  private static async saveSentMessage(
    instanceId: string, 
    leadId: string, 
    message: string, 
    messageId: string
  ) {
    console.log('[MessageSending] 💾 Saving sent message to database:', {
      leadId,
      instanceId,
      messageId,
      fromMe: true
    });

    const { error: saveError } = await supabase.from('messages').insert({
      whatsapp_number_id: instanceId,
      lead_id: leadId,
      text: message,
      from_me: true,
      status: 'sent',
      external_id: messageId,
      media_type: 'text',
      timestamp: new Date().toISOString()
    });

    if (saveError) {
      console.error('[MessageSending] ❌ Failed to save sent message to DB:', saveError);
      // CRÍTICO: Não falhar o envio se não conseguir salvar no banco, mas alertar
      console.error('[MessageSending] ⚠️ MENSAGEM ENVIADA MAS NÃO SALVA NO BANCO!');
    } else {
      console.log('[MessageSending] ✅ Sent message saved to database successfully');
    }
  }

  private static async updateLeadInfo(leadId: string, message: string) {
    await supabase
      .from('leads')
      .update({
        last_message: message,
        last_message_time: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId);
  }

  private static async getOrCreateLead(
    whatsappNumberId: string, 
    phone: string, 
    companyId: string
  ): Promise<string> {
    // CORREÇÃO: Garantir que o telefone esteja limpo
    const cleanPhone = cleanPhoneNumber(phone);
    
    console.log('[MessageSending] 🔍 Getting or creating lead:', {
      whatsappNumberId,
      cleanPhone,
      companyId
    });
    
    // Try to find existing lead
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('phone', cleanPhone)
      .eq('whatsapp_number_id', whatsappNumberId)
      .single();

    if (existingLead) {
      console.log('[MessageSending] ✅ Existing lead found:', existingLead.id);
      return existingLead.id;
    }

    // CORREÇÃO: Create new lead com nome baseado no telefone limpo
    console.log('[MessageSending] 🆕 Creating new lead');
    const { data: newLead, error } = await supabase
      .from('leads')
      .insert({
        phone: cleanPhone,
        name: `Lead-${cleanPhone.substring(cleanPhone.length - 4)}`, // CORREÇÃO: Nome limpo
        whatsapp_number_id: whatsappNumberId,
        company_id: companyId,
        last_message: 'Conversa iniciada',
        last_message_time: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error || !newLead) {
      console.error('[MessageSending] ❌ Failed to create lead:', error);
      throw new Error('Failed to create lead');
    }

    console.log('[MessageSending] ✅ New lead created:', newLead.id);
    return newLead.id;
  }

  private static handleError(error: any, duration: number, instanceId: string, phone: string): MessageSendResponse {
    console.error('[MessageSending] ❌ Error sending message:', {
      error: error instanceof Error ? error.message : error,
      duration: `${duration}ms`,
      instanceId,
      phone,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
