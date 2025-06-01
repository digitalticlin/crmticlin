
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";
import { toast } from "sonner";

export class InstanceService {
  static generateInstanceName(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `whatsapp_${timestamp}_${random}`;
  }

  static async createInstance(instanceName?: string): Promise<any> {
    const name = instanceName || this.generateInstanceName();
    console.log('[InstanceService] Creating instance with name:', name);
    
    const result = await WhatsAppWebService.createInstance(name);
    console.log('[InstanceService] Create instance result:', result);

    if (!result.success) {
      throw new Error(result.error || 'Failed to create instance');
    }

    return result;
  }

  static async deleteInstance(instanceId: string): Promise<void> {
    console.log('[InstanceService] Deleting instance:', instanceId);
    
    const result = await WhatsAppWebService.deleteInstance(instanceId);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete instance');
    }

    toast.success('Instância removida com sucesso!');
  }

  static async refreshQRCode(vpsInstanceId: string): Promise<string> {
    console.log('[InstanceService] Refreshing QR code for instance:', vpsInstanceId);

    const result = await WhatsAppWebService.getQRCode(vpsInstanceId);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to get QR code');
    }

    return result.qrCode;
  }

  static async syncInstanceStatus(vpsInstanceId: string): Promise<any> {
    console.log('[InstanceService] Syncing status for instance:', vpsInstanceId);

    const result = await WhatsAppWebService.syncInstanceStatus(vpsInstanceId);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to sync status');
    }

    return result;
  }

  static async forceSync(vpsInstanceId: string): Promise<any> {
    console.log('[InstanceService] Force syncing instance:', vpsInstanceId);

    const result = await WhatsAppWebService.forceSync(vpsInstanceId);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to force sync');
    }

    return result;
  }

  static async sendMessage(instanceId: string, phone: string, message: string): Promise<boolean> {
    const result = await WhatsAppWebService.sendMessage(instanceId, phone, message);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to send message');
    }

    return true;
  }
}
