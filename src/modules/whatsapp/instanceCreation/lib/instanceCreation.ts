
import { InstanceApi } from '../api/instanceApi';
import type { CreateInstanceParams, CreateInstanceResult } from '../types/instanceTypes';

export class InstanceCreationService {
  static async createInstance(params: CreateInstanceParams): Promise<CreateInstanceResult> {
    try {
      console.log('[InstanceCreationService] 🚀 Criando instância via estrutura modular:', params);
      
      // CORREÇÃO: Usar email completo se não fornecido nome específico
      const intelligentName = params.instanceName || 
        params.userEmail.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
      
      // Chamar API modular
      const result = await InstanceApi.createInstance({
        instanceName: intelligentName,
        userEmail: params.userEmail,
        companyId: params.companyId
      });

      if (result.success) {
        console.log('[InstanceCreationService] ✅ Instância criada via estrutura modular:', {
          instanceName: intelligentName,
          instanceId: result.instance?.id,
          // CORREÇÃO: Retornar status correto
          status: 'pending' // Status inicial deve ser pending
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
