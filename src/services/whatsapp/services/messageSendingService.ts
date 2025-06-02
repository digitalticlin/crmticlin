
import { supabase } from "@/integrations/supabase/client";
import { VPS_CONFIG } from "../config/vpsConfig";
import { ServiceResponse } from "../types/whatsappWebTypes";

export class MessageSendingService {
  static async sendMessage(
    instanceId: string, 
    phone: string, 
    message: string
  ): Promise<ServiceResponse> {
    try {
      console.log('[MessageSending] Sending message via WhatsApp Web:', {
        instanceId,
        phone,
        messageLength: message.length
      });

      // Get instance data from database
      const { data: instance, error: instanceError } = await supabase
        .from('whatsapp_instances')
        .select('vps_instance_id, connection_status, company_id')
        .eq('id', instanceId)
        .single();

      if (instanceError || !instance) {
        throw new Error('Instance not found');
      }

      if (instance.connection_status !== 'open') {
        throw new Error(`Instance not ready. Status: ${instance.connection_status}`);
      }

      // Send message directly to VPS server
      const response = await fetch(`${VPS_CONFIG.baseUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VPS_CONFIG.authToken}`
        },
        body: JSON.stringify({
          instanceId: instance.vps_instance_id,
          phone,
          message
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message');
      }

      console.log('[MessageSending] ✅ Message sent successfully:', result);

      // Save message to database
      await supabase.from('messages').insert({
        whatsapp_number_id: instanceId,
        lead_id: await this.getOrCreateLead(instanceId, phone, instance.company_id),
        text: message,
        from_me: true,
        status: 'sent',
        external_id: result.messageId,
        media_type: 'text',
        timestamp: new Date().toISOString()
      });

      return { 
        success: true,
        data: {
          messageId: result.messageId,
          timestamp: result.timestamp
        }
      };

    } catch (error) {
      console.error('[MessageSending] Error sending message:', error);
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
    
    // Try to find existing lead
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('phone', cleanPhone)
      .eq('whatsapp_number_id', whatsappNumberId)
      .single();

    if (existingLead) {
      return existingLead.id;
    }

    // Create new lead
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
      throw new Error('Failed to create lead');
    }

    return newLead.id;
  }
}
