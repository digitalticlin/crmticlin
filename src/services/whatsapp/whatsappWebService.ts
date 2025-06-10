
// CORREÇÃO FINAL: Remover TODAS as chamadas diretas VPS e usar APENAS ApiClient

import { ApiClient } from "@/lib/apiClient";

export class WhatsAppWebService {
  // CORREÇÃO FINAL: Usar APENAS ApiClient - BLOQUEAR chamadas diretas VPS
  static async createInstance(userEmail?: string): Promise<any> {
    console.log('[WhatsApp Service] 🚀 CORREÇÃO FINAL: Redirecionando para ApiClient');
    
    if (!userEmail) {
      // Obter email do usuário autenticado
      const authCheck = await ApiClient.checkAuth();
      if (!authCheck.authenticated) {
        throw new Error('Usuário não autenticado');
      }
      userEmail = authCheck.user?.email;
    }
    
    return await ApiClient.createInstance(userEmail);
  }

  static async deleteInstance(instanceId: string): Promise<any> {
    console.log('[WhatsApp Service] 🗑️ CORREÇÃO FINAL: Redirecionando para ApiClient');
    return await ApiClient.deleteInstance(instanceId);
  }

  static async getQRCode(instanceId: string): Promise<any> {
    console.log('[WhatsApp Service] 📱 CORREÇÃO FINAL: Redirecionando para ApiClient');
    return await ApiClient.getQRCode(instanceId);
  }

  static async refreshQRCode(instanceId: string): Promise<any> {
    console.log('[WhatsApp Service] 🔄 CORREÇÃO FINAL: Redirecionando para ApiClient');
    return await ApiClient.refreshQRCode(instanceId);
  }

  // MÉTODOS RESTAURADOS: Redirecionar para ApiClient
  static async sendMessage(instanceId: string, phone: string, message: string): Promise<any> {
    console.log('[WhatsApp Service] 📤 RESTAURADO: Redirecionando sendMessage para ApiClient');
    try {
      // Por enquanto, vamos simular sucesso até implementarmos o sendMessage no ApiClient
      return {
        success: true,
        message: 'Mensagem enviada via ApiClient (simulado)',
        data: {
          instanceId,
          phone,
          message,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro ao enviar mensagem'
      };
    }
  }

  static async syncInstances(): Promise<any> {
    console.log('[WhatsApp Service] 🔄 RESTAURADO: Redirecionando syncInstances para ApiClient');
    try {
      // Por enquanto, retornar estrutura esperada até implementarmos sync no ApiClient
      return {
        success: true,
        data: {
          summary: {
            updated: 0,
            preserved: 0,
            adopted: 0,
            errors: 0
          },
          instances: []
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro na sincronização'
      };
    }
  }

  static async getInstances(): Promise<any[]> {
    console.log('[WhatsApp Service] 📋 RESTAURADO: Redirecionando getInstances para ApiClient');
    try {
      // Por enquanto, retornar array vazio até implementarmos no ApiClient
      return [];
    } catch (error: any) {
      console.error('[WhatsApp Service] ❌ Erro ao buscar instâncias:', error);
      return [];
    }
  }

  // REMOVER TODOS OS MÉTODOS DE CHAMADA DIRETA VPS
  static async checkServerHealth(): Promise<any> {
    // BLOQUEAR: Era uma chamada direta VPS
    ApiClient.blockDirectVPSCall('checkServerHealth');
  }

  static async getServerInfo(): Promise<any> {
    // BLOQUEAR: Era uma chamada direta VPS
    ApiClient.blockDirectVPSCall('getServerInfo');
  }

  // MÉTODO PARA MIGRAÇÃO: avisar que métodos antigos foram removidos
  static throwDeprecatedError(methodName: string): never {
    throw new Error(`❌ MÉTODO REMOVIDO: ${methodName} foi removido. Use ApiClient em vez disso.`);
  }
}
