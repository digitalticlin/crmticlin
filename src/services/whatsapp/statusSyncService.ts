
import { supabase } from "@/integrations/supabase/client";

interface VPSInstanceStatus {
  success: boolean;
  instanceId: string;
  status: string;
  phone?: string;
  profileName?: string;
  hasQR: boolean;
  error?: string;
}

interface StatusSyncResult {
  success: boolean;
  updated: number;
  errors: string[];
}

export class StatusSyncService {
  private static VPS_CONFIG = {
    baseUrl: 'http://31.97.163.57:3001', // CORREÇÃO: VPS correta
    authToken: 'bJyn3eUPFTRFNCxxLNd8KH5bI4Zg7bpUk7ADO6kXf49026a1' // CORREÇÃO: Token correto
  };

  static async getVPSInstanceStatus(vpsInstanceId: string): Promise<VPSInstanceStatus | null> {
    try {
      console.log(`[Status Sync] 📡 Verificando status VPS para: ${vpsInstanceId}`);
      
      const response = await fetch(`${this.VPS_CONFIG.baseUrl}/instance/${vpsInstanceId}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.VPS_CONFIG.authToken}`
        }
      });

      if (!response.ok) {
        console.error(`[Status Sync] ❌ VPS status error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      console.log(`[Status Sync] ✅ VPS status recebido:`, data);
      
      return data;
    } catch (error) {
      console.error(`[Status Sync] ❌ Erro ao consultar VPS:`, error);
      return null;
    }
  }

  static async syncInstanceStatus(instanceId: string): Promise<boolean> {
    try {
      console.log(`[Status Sync] 🔄 Sincronizando instância: ${instanceId}`);
      
      // Buscar dados da instância no Supabase
      const { data: instance, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('id', instanceId)
        .single();

      if (fetchError || !instance?.vps_instance_id) {
        console.error(`[Status Sync] ❌ Instância não encontrada:`, fetchError);
        return false;
      }

      // Consultar status real na VPS
      const vpsStatus = await this.getVPSInstanceStatus(instance.vps_instance_id);
      
      if (!vpsStatus) {
        console.log(`[Status Sync] ⚠️ VPS não respondeu para ${instance.vps_instance_id}`);
        return false;
      }

      // Mapear status VPS para Supabase
      const statusMapping = {
        'ready': 'ready',
        'connected': 'ready', 
        'open': 'ready',
        'connecting': 'connecting',
        'waiting_qr': 'waiting_qr',
        'disconnected': 'disconnected',
        'error': 'error'
      };

      const newConnectionStatus = statusMapping[vpsStatus.status] || 'disconnected';
      const newWebStatus = vpsStatus.status;

      // Verificar se precisa atualizar
      const needsUpdate = 
        instance.connection_status !== newConnectionStatus ||
        instance.web_status !== newWebStatus ||
        (vpsStatus.phone && instance.phone !== vpsStatus.phone) ||
        (vpsStatus.profileName && instance.profile_name !== vpsStatus.profileName);

      if (!needsUpdate) {
        console.log(`[Status Sync] ℹ️ Status já sincronizado para ${instanceId}`);
        return true;
      }

      // Atualizar no Supabase
      const updateData: any = {
        connection_status: newConnectionStatus,
        web_status: newWebStatus,
        updated_at: new Date().toISOString()
      };

      if (vpsStatus.phone && vpsStatus.phone !== instance.phone) {
        updateData.phone = vpsStatus.phone;
      }

      if (vpsStatus.profileName && vpsStatus.profileName !== instance.profile_name) {
        updateData.profile_name = vpsStatus.profileName;
      }

      // Se mudou para conectado, registrar data de conexão
      if (newConnectionStatus === 'ready' && instance.connection_status !== 'ready') {
        updateData.date_connected = new Date().toISOString();
        updateData.qr_code = null; // Limpar QR Code quando conectar
      }

      // Se mudou para desconectado, registrar data de desconexão
      if (newConnectionStatus === 'disconnected' && instance.connection_status !== 'disconnected') {
        updateData.date_disconnected = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('whatsapp_instances')
        .update(updateData)
        .eq('id', instanceId);

      if (updateError) {
        console.error(`[Status Sync] ❌ Erro ao atualizar BD:`, updateError);
        return false;
      }

      console.log(`[Status Sync] ✅ Status sincronizado: ${instanceId} → ${newConnectionStatus}`);
      return true;

    } catch (error) {
      console.error(`[Status Sync] ❌ Erro na sincronização:`, error);
      return false;
    }
  }

  static async syncAllUserInstances(): Promise<StatusSyncResult> {
    try {
      console.log(`[Status Sync] 🔄 Sincronizando todas as instâncias do usuário`);
      
      // Buscar todas as instâncias do usuário
      const { data: instances, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('connection_type', 'web')
        .not('vps_instance_id', 'is', null);

      if (error) {
        throw new Error(`Erro ao buscar instâncias: ${error.message}`);
      }

      let updated = 0;
      const errors: string[] = [];

      // Sincronizar cada instância
      for (const instance of instances || []) {
        try {
          const success = await this.syncInstanceStatus(instance.id);
          if (success) {
            updated++;
          } else {
            errors.push(`Falha na sincronização: ${instance.instance_name}`);
          }
        } catch (err) {
          errors.push(`Erro em ${instance.instance_name}: ${err.message}`);
        }
      }

      console.log(`[Status Sync] ✅ Sincronização completa: ${updated} atualizadas, ${errors.length} erros`);
      
      return {
        success: errors.length === 0,
        updated,
        errors
      };

    } catch (error) {
      console.error(`[Status Sync] ❌ Erro na sincronização geral:`, error);
      return {
        success: false,
        updated: 0,
        errors: [error.message]
      };
    }
  }
}
