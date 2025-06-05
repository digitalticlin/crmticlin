
import { supabase } from "@/integrations/supabase/client";
import { VPS_CONFIG } from "../config/vpsConfig";
import { ServiceResponse } from "../types/whatsappWebTypes";

export class MessageSendingService {
  static async sendMessage(
    instanceId: string, 
    phone: string, 
    message: string
  ): Promise<ServiceResponse> {
    const startTime = Date.now();
    
    try {
      console.log('[MessageSending FASE 3] 📤 Iniciando envio de mensagem:', {
        instanceId,
        phone,
        messageLength: message.length,
        timestamp: new Date().toISOString()
      });

      // CORRIGIDO: Buscar instância pelo UUID diretamente
      const { data: instance, error: instanceError } = await supabase
        .from('whatsapp_instances')
        .select('vps_instance_id, connection_status, company_id, instance_name')
        .eq('id', instanceId) // Usando o UUID da instância
        .single();

      if (instanceError || !instance) {
        console.error('[MessageSending FASE 3] ❌ Instance not found:', { instanceId, instanceError });
        throw new Error(`Instance not found: ${instanceId}`);
      }

      console.log('[MessageSending FASE 3] 🔍 Instance data found:', {
        vpsInstanceId: instance.vps_instance_id,
        connectionStatus: instance.connection_status,
        companyId: instance.company_id,
        instanceName: instance.instance_name
      });

      if (!['ready', 'open'].includes(instance.connection_status)) {
        console.error('[MessageSending FASE 3] ❌ Instance not ready:', {
          status: instance.connection_status,
          instanceId,
          instanceName: instance.instance_name
        });
        throw new Error(`Instance not ready. Status: ${instance.connection_status}`);
      }

      // Clean phone number
      const cleanPhone = phone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

      // Send message directly to VPS server usando vps_instance_id
      const vpsUrl = `${VPS_CONFIG.baseUrl}/send`;
      const requestBody = {
        instanceId: instance.vps_instance_id,
        phone: formattedPhone,
        message
      };

      console.log('[MessageSending FASE 3] 🚀 Sending to VPS:', {
        url: vpsUrl,
        vpsInstanceId: instance.vps_instance_id,
        phone: formattedPhone,
        hasAuthToken: !!VPS_CONFIG.authToken
      });

      const response = await fetch(vpsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VPS_CONFIG.authToken}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[MessageSending FASE 3] ❌ VPS request failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText.substring(0, 200),
          url: vpsUrl
        });
        throw new Error(`VPS send failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('[MessageSending FASE 3] ✅ VPS response received:', {
        success: result.success,
        messageId: result.messageId,
        duration: `${Date.now() - startTime}ms`
      });

      if (!result.success) {
        throw new Error(result.error || 'VPS returned success: false');
      }

      // CORRIGIDO: Buscar ou criar lead primeiro e depois salvar mensagem
      const leadId = await this.getOrCreateLead(instanceId, cleanPhone, instance.company_id);
      
      console.log('[MessageSending FASE 3] 💾 Saving sent message to database:', {
        leadId,
        instanceId,
        messageId: result.messageId,
        fromMe: true
      });

      // CORRIGIDO: Salvar mensagem enviada com from_me: true
      const { error: saveError } = await supabase.from('messages').insert({
        whatsapp_number_id: instanceId,
        lead_id: leadId,
        text: message,
        from_me: true,
        status: 'sent',
        external_id: result.messageId,
        media_type: 'text',
        timestamp: new Date().toISOString()
      });

      if (saveError) {
        console.error('[MessageSending FASE 3] ❌ Failed to save sent message to DB:', saveError);
        console.error('[MessageSending FASE 3] ❌ Save error details:', {
          error: saveError,
          instanceId,
          leadId,
          messageText: message.substring(0, 50),
          tableName: 'messages',
          operation: 'insert'
        });
        // IMPORTANTE: Não falhar o envio se não conseguir salvar no banco
      } else {
        console.log('[MessageSending FASE 3] ✅ Sent message saved to database successfully');
      }

      // Update lead with last message info
      await supabase
        .from('leads')
        .update({
          last_message: message,
          last_message_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      const duration = Date.now() - startTime;
      console.log('[MessageSending FASE 3] ✅ Message sent and saved successfully:', {
        messageId: result.messageId,
        duration: `${duration}ms`,
        leadId,
        savedToDatabase: !saveError
      });

      return { 
        success: true,
        data: {
          messageId: result.messageId,
          timestamp: result.timestamp || new Date().toISOString(),
          leadId
        }
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('[MessageSending FASE 3] ❌ Error sending message:', {
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

  private static async getOrCreateLead(
    whatsappNumberId: string, 
    phone: string, 
    companyId: string
  ): Promise<string> {
    const cleanPhone = phone.replace(/\D/g, '');
    
    console.log('[MessageSending FASE 3] 🔍 Getting or creating lead:', {
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
      console.log('[MessageSending FASE 3] ✅ Existing lead found:', existingLead.id);
      return existingLead.id;
    }

    // Create new lead
    console.log('[MessageSending FASE 3] 🆕 Creating new lead');
    const { data: newLead, error } = await supabase
      .from('leads')
      .insert({
        phone: cleanPhone,
        name: `+${cleanPhone}`,
        whatsapp_number_id: whatsappNumberId,
        company_id: companyId,
        last_message: 'Conversa iniciada',
        last_message_time: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error || !newLead) {
      console.error('[MessageSending FASE 3] ❌ Failed to create lead:', error);
      throw new Error('Failed to create lead');
    }

    console.log('[MessageSending FASE 3] ✅ New lead created:', newLead.id);
    return newLead.id;
  }
}
