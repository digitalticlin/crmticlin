
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
      console.log('[MessageSending] 📤 Iniciando envio de mensagem:', {
        instanceId,
        phone,
        messageLength: message.length,
        timestamp: new Date().toISOString()
      });

      // Get instance data from database - BUSCAR vps_instance_id PELO ID
      const { data: instance, error: instanceError } = await supabase
        .from('whatsapp_instances')
        .select('vps_instance_id, connection_status, company_id')
        .eq('id', instanceId) // CORRIGIDO: Buscar pelo ID da instância
        .single();

      if (instanceError || !instance) {
        console.error('[MessageSending] ❌ Instance not found:', { instanceId, instanceError });
        throw new Error(`Instance not found: ${instanceId}`);
      }

      console.log('[MessageSending] 🔍 Instance data found:', {
        vpsInstanceId: instance.vps_instance_id,
        connectionStatus: instance.connection_status,
        companyId: instance.company_id
      });

      if (instance.connection_status !== 'open') {
        console.error('[MessageSending] ❌ Instance not ready:', {
          status: instance.connection_status,
          instanceId
        });
        throw new Error(`Instance not ready. Status: ${instance.connection_status}`);
      }

      // Send message directly to VPS server usando vps_instance_id
      const vpsUrl = `${VPS_CONFIG.baseUrl}/send`;
      const requestBody = {
        instanceId: instance.vps_instance_id, // USAR vps_instance_id para o VPS
        phone,
        message
      };

      console.log('[MessageSending] 🚀 Sending to VPS:', {
        url: vpsUrl,
        vpsInstanceId: instance.vps_instance_id,
        phone
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
        console.error('[MessageSending] ❌ VPS request failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText.substring(0, 200)
        });
        throw new Error(`VPS send failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('[MessageSending] ✅ VPS response received:', {
        success: result.success,
        messageId: result.messageId,
        duration: `${Date.now() - startTime}ms`
      });

      if (!result.success) {
        throw new Error(result.error || 'VPS returned success: false');
      }

      // Save message to database
      const leadId = await this.getOrCreateLead(instanceId, phone, instance.company_id);
      
      console.log('[MessageSending] 💾 Saving message to database:', {
        leadId,
        instanceId,
        messageId: result.messageId
      });

      const { error: saveError } = await supabase.from('messages').insert({
        whatsapp_number_id: instanceId, // USAR instanceId do banco
        lead_id: leadId,
        text: message,
        from_me: true,
        status: 'sent',
        external_id: result.messageId,
        media_type: 'text',
        timestamp: new Date().toISOString()
      });

      if (saveError) {
        console.error('[MessageSending] ⚠️ Failed to save message to DB:', saveError);
        // Não falhar o envio se não conseguir salvar no banco
      }

      const duration = Date.now() - startTime;
      console.log('[MessageSending] ✅ Message sent successfully:', {
        messageId: result.messageId,
        duration: `${duration}ms`,
        leadId
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
      console.error('[MessageSending] ❌ Error sending message:', {
        error: error instanceof Error ? error.message : error,
        duration: `${duration}ms`,
        instanceId,
        phone
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

    // Create new lead
    console.log('[MessageSending] 🆕 Creating new lead');
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
      console.error('[MessageSending] ❌ Failed to create lead:', error);
      throw new Error('Failed to create lead');
    }

    console.log('[MessageSending] ✅ New lead created:', newLead.id);
    return newLead.id;
  }
}
