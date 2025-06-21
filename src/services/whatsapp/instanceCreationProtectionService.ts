
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebService } from "./whatsappWebService";

export interface CreationProtectionConfig {
  maxRetries: number;
  retryDelay: number;
  qrCodeTimeout: number;
  healthCheckInterval: number;
  autoRecovery: boolean;
}

export class InstanceCreationProtectionService {
  private static config: CreationProtectionConfig = {
    maxRetries: 3,
    retryDelay: 2000,
    qrCodeTimeout: 30000,
    healthCheckInterval: 60000,
    autoRecovery: true
  };

  /**
   * Criação blindada de instância com retry automático
   */
  static async createInstanceWithProtection(
    instanceName: string,
    createdByUserId: string
  ): Promise<{ success: boolean; instance?: any; error?: string; retries?: number }> {
    let lastError: string = '';
    let retryCount = 0;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        console.log(`[Protection] 🛡️ Tentativa ${attempt}/${this.config.maxRetries} de criar instância: ${instanceName}`);
        
        // Verificar se não existe instância com mesmo nome
        await this.validateInstanceName(instanceName, createdByUserId);
        
        // Tentar criar a instância
        const result = await WhatsAppWebService.createInstance(instanceName);
        
        if (result.success && result.instance) {
          console.log(`[Protection] ✅ Instância criada com sucesso na tentativa ${attempt}`);
          
          // Verificar integridade após criação
          const integrity = await this.verifyInstanceIntegrity(result.instance.id);
          
          if (integrity.valid) {
            return {
              success: true,
              instance: result.instance,
              retries: retryCount
            };
          } else {
            throw new Error(`Falha na verificação de integridade: ${integrity.error}`);
          }
        } else {
          throw new Error(result.error || 'Falha na criação da instância');
        }
      } catch (error: any) {
        lastError = error.message;
        retryCount++;
        
        console.warn(`[Protection] ⚠️ Tentativa ${attempt} falhou: ${lastError}`);
        
        if (attempt < this.config.maxRetries) {
          console.log(`[Protection] ⏳ Aguardando ${this.config.retryDelay}ms antes da próxima tentativa...`);
          await this.delay(this.config.retryDelay);
        }
      }
    }

    return {
      success: false,
      error: `Falha após ${this.config.maxRetries} tentativas: ${lastError}`,
      retries: retryCount
    };
  }

  /**
   * Validação de nome de instância
   */
  private static async validateInstanceName(instanceName: string, createdByUserId: string): Promise<void> {
    // Verificar no banco local
    const { data: existing, error } = await supabase
      .from('whatsapp_instances')
      .select('id')
      .eq('instance_name', instanceName)
      .eq('created_by_user_id', createdByUserId)
      .single();

    if (existing && !error) {
      throw new Error(`Instância com nome "${instanceName}" já existe`);
    }

    // Validar formato do nome
    if (!/^[a-zA-Z0-9_-]+$/.test(instanceName)) {
      throw new Error('Nome da instância deve conter apenas letras, números, _ e -');
    }

    if (instanceName.length < 3 || instanceName.length > 50) {
      throw new Error('Nome da instância deve ter entre 3 e 50 caracteres');
    }
  }

  /**
   * Verificação de integridade da instância criada
   */
  private static async verifyInstanceIntegrity(instanceId: string): Promise<{ valid: boolean; error?: string }> {
    try {
      console.log(`[Protection] 🔍 Verificando integridade da instância: ${instanceId}`);
      
      // Verificar se existe no banco
      const { data: dbInstance, error: dbError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('id', instanceId)
        .single();

      if (dbError || !dbInstance) {
        return { valid: false, error: 'Instância não encontrada no banco' };
      }

      // Verificar campos obrigatórios
      if (!dbInstance.vps_instance_id) {
        return { valid: false, error: 'VPS Instance ID ausente' };
      }

      if (!dbInstance.created_by_user_id) {
        return { valid: false, error: 'Created By User ID ausente' };
      }

      // Verificar se tem QR Code ou está conectada
      const hasQR = dbInstance.qr_code && dbInstance.qr_code.length > 10;
      const isConnected = ['ready', 'open'].includes(dbInstance.connection_status);
      
      if (!hasQR && !isConnected) {
        return { valid: false, error: 'Instância sem QR Code e não conectada' };
      }

      console.log(`[Protection] ✅ Integridade verificada com sucesso`);
      return { valid: true };
    } catch (error: any) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * QR Code blindado com timeout e retry
   */
  static async getQRCodeWithProtection(instanceId: string): Promise<{ success: boolean; qrCode?: string; error?: string }> {
    console.log(`[Protection] 📱 Obtendo QR Code blindado para: ${instanceId}`);
    
    const startTime = Date.now();
    let lastError: string = '';

    while (Date.now() - startTime < this.config.qrCodeTimeout) {
      try {
        const result = await WhatsAppWebService.getQRCode(instanceId);
        
        if (result.success && result.qrCode) {
          // Validar QR Code
          if (this.isValidQRCode(result.qrCode)) {
            console.log(`[Protection] ✅ QR Code válido obtido`);
            return { success: true, qrCode: result.qrCode };
          } else {
            throw new Error('QR Code inválido recebido');
          }
        } else if (result.waiting) {
          console.log(`[Protection] ⏳ QR Code ainda sendo gerado...`);
          await this.delay(2000);
          continue;
        } else {
          throw new Error(result.error || 'Falha ao obter QR Code');
        }
      } catch (error: any) {
        lastError = error.message;
        console.warn(`[Protection] ⚠️ Erro ao obter QR: ${lastError}`);
        await this.delay(3000);
      }
    }

    return {
      success: false,
      error: `Timeout após ${this.config.qrCodeTimeout}ms: ${lastError}`
    };
  }

  /**
   * Validação de QR Code
   */
  private static isValidQRCode(qrCode: string): boolean {
    if (!qrCode || typeof qrCode !== 'string') {
      return false;
    }

    // QR Code deve ter um tamanho mínimo
    if (qrCode.length < 50) {
      return false;
    }

    // Verificar se é base64 ou URL válida
    const isBase64 = /^data:image\/[a-zA-Z]+;base64,/.test(qrCode);
    const isUrl = /^https?:\/\//.test(qrCode);
    
    return isBase64 || isUrl;
  }

  /**
   * Health Check automático de instâncias
   */
  static async performInstanceHealthCheck(createdByUserId: string): Promise<{
    healthy: number;
    warnings: number;
    errors: number;
    details: any[];
  }> {
    try {
      console.log(`[Protection] 🏥 Health check para usuário: ${createdByUserId}`);
      
      const { data: instances, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('created_by_user_id', createdByUserId)
        .eq('connection_type', 'web');

      if (error) throw error;

      let healthy = 0;
      let warnings = 0;
      let errors = 0;
      const details: any[] = [];

      for (const instance of instances || []) {
        const check = await this.checkSingleInstance(instance);
        
        if (check.status === 'healthy') healthy++;
        else if (check.status === 'warning') warnings++;
        else errors++;
        
        details.push(check);
      }

      return { healthy, warnings, errors, details };
    } catch (error) {
      console.error('[Protection] ❌ Erro no health check:', error);
      return { healthy: 0, warnings: 0, errors: 1, details: [] };
    }
  }

  /**
   * Verificação de uma instância específica
   */
  private static async checkSingleInstance(instance: any): Promise<any> {
    const issues: string[] = [];
    let status = 'healthy';

    // Verificar campos obrigatórios
    if (!instance.vps_instance_id) {
      issues.push('VPS Instance ID ausente');
      status = 'error';
    }

    // Verificar status de conexão
    if (!['ready', 'open', 'connecting'].includes(instance.connection_status)) {
      issues.push(`Status inválido: ${instance.connection_status}`);
      status = 'error';
    }

    // Verificar se está órfã há muito tempo
    if (instance.connection_status === 'connecting') {
      const createdAt = new Date(instance.created_at);
      const now = new Date();
      const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > 2) {
        issues.push('Conectando há mais de 2 horas');
        status = status === 'healthy' ? 'warning' : status;
      }
    }

    return {
      instanceId: instance.id,
      instanceName: instance.instance_name,
      status,
      issues
    };
  }

  /**
   * Delay helper
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Configurar proteções
   */
  static configureProtection(config: Partial<CreationProtectionConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[Protection] ⚙️ Configuração atualizada:', this.config);
  }
}
