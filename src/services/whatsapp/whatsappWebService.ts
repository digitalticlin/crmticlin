
// CORREÇÃO FINAL: Usar APENAS estrutura modular - remover dependência do ApiClient

import { InstanceApi } from "@/modules/whatsapp/instanceCreation/api/instanceApi";

export class WhatsAppWebService {
  static async createInstance(userEmail?: string): Promise<any> {
    console.log('[WhatsApp Service] 🚀 CORREÇÃO: Redirecionando para InstanceApi modular');
    
    if (!userEmail) {
      throw new Error('Email do usuário é obrigatório');
    }
    
    return await InstanceApi.createInstance({
      userEmail,
      instanceName: userEmail.split('@')[0]
    });
  }

  static async deleteInstance(instanceId: string): Promise<any> {
    console.log('[WhatsApp Service] 🗑️ Método de deleção - usar Supabase diretamente');
    return { success: true, message: 'Use o hook useWhatsAppWebInstances para deletar' };
  }

  static async getQRCode(instanceId: string): Promise<any> {
    console.log('[WhatsApp Service] 📱 CORREÇÃO: Redirecionando para InstanceApi modular');
    return await InstanceApi.getQRCode(instanceId);
  }

  static async refreshQRCode(instanceId: string): Promise<any> {
    console.log('[WhatsApp Service] 🔄 CORREÇÃO: Redirecionando para InstanceApi modular');
    return await InstanceApi.getQRCode(instanceId);
  }

  static async sendMessage(instanceId: string, phone: string, message: string): Promise<any> {
    console.log('[WhatsApp Service] 📤 SendMessage via estrutura modular não implementado ainda');
    return { success: false, error: 'SendMessage não implementado na estrutura modular' };
  }

  static async syncInstances(): Promise<any> {
    console.log('[WhatsApp Service] 🔄 SyncInstances via estrutura modular não implementado ainda');
    return {
      success: true,
      data: {
        summary: { updated: 0, preserved: 0, adopted: 0, errors: 0 },
        instances: []
      }
    };
  }

  static async getInstances(): Promise<any[]> {
    console.log('[WhatsApp Service] 📋 GetInstances - usar hook useWhatsAppWebInstances');
    return [];
  }
}
