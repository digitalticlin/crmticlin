
import { InstanceApi } from '../api/instanceApi';
import type { CreateInstanceParams, CreateInstanceResult } from '../types/instanceTypes';

export class InstanceCreationService {
  static async createInstance(params: CreateInstanceParams): Promise<CreateInstanceResult> {
    try {
      console.log('[InstanceCreationService] 🚀 Criando instância via estrutura modular:', params);
      
      // Gerar nome inteligente se não fornecido
      const intelligentName = params.instanceName || 
        params.userEmail.split('@')[0].toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
      
      // Chamar API modular
      const result = await InstanceApi.createInstance({
        instanceName: intelligentName,
        userEmail: params.userEmail,
        companyId: params.companyId
      });

      if (result.success) {
        console.log('[InstanceCreationService] ✅ Instância criada via estrutura modular:', {
          instanceName: intelligentName,
          instanceId: result.instance?.id
        });
      } else {
        console.error('[InstanceCreationService] ❌ Falha na criação:', result.error);
      }

      return result;

    } catch (error: any) {
      console.error('[InstanceCreationService] ❌ Erro:', error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido'
      };
    }
  }
}

// Export CreateInstanceResult para resolver import
export type { CreateInstanceResult } from '../types/instanceTypes';
