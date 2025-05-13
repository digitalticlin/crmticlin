
import { toast } from "sonner";

export interface EvolutionInstance {
  instanceName: string;
  instanceId: string;
  integration: string;
  status: "connected" | "connecting" | "disconnected";
  qrcode?: {
    pairingCode: string | null;
    code: string | null;
    base64: string | null;
    count: number;
  };
}

interface CreateInstanceResponse {
  instance: {
    instanceName: string;
    instanceId: string;
    integration: string;
    webhookWaBusiness: string | null;
    accessTokenWaBusiness: string;
    status: "connected" | "connecting" | "disconnected";
  };
  hash: string;
  webhook: Record<string, any>;
  websocket: Record<string, any>;
  rabbitmq: Record<string, any>;
  sqs: Record<string, any>;
  settings: {
    rejectCall: boolean;
    msgCall: string;
    groupsIgnore: boolean;
    alwaysOnline: boolean;
    readMessages: boolean;
    readStatus: boolean;
    syncFullHistory: boolean;
    wavoipToken: string;
  };
  qrcode: {
    pairingCode: string | null;
    code: string | null;
    base64: string | null;
    count: number;
  };
}

interface FetchInstancesResponse {
  instances: Array<{
    instanceName: string;
    instanceId: string;
    integration: string;
    status: "connected" | "connecting" | "disconnected";
  }>;
}

const API_URL = "https://ticlin-evolution-api.eirfpl.easypanel.host";
const API_KEY = "JTZZDXMpymy7RETTvXdA9VxKdD0Mdj7t";

class EvolutionApiService {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  private async fetchWithHeaders(endpoint: string, options: RequestInit = {}) {
    const headers = {
      "Content-Type": "application/json",
      "apikey": this.apiKey,
      ...options.headers
    };

    try {
      const response = await fetch(`${this.apiUrl}${endpoint}`, {
        ...options,
        headers
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Erro na solicitação: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Erro ao acessar ${endpoint}:`, error);
      throw error;
    }
  }

  // Buscar todas as instâncias existentes
  async fetchInstances(): Promise<EvolutionInstance[]> {
    try {
      const data = await this.fetchWithHeaders("/instance/fetchInstances", {
        method: "GET"
      }) as FetchInstancesResponse;
      
      return data.instances;
    } catch (error) {
      console.error("Erro ao buscar instâncias:", error);
      toast.error("Não foi possível obter as instâncias existentes");
      return [];
    }
  }

  // Verificar se um nome de instância já existe e gerar um novo se necessário
  async getUniqueInstanceName(baseName: string): Promise<string> {
    try {
      const instances = await this.fetchInstances();
      const existingNames = instances.map(instance => instance.instanceName);
      
      // Verificar se o nome base já existe
      if (!existingNames.includes(baseName)) {
        return baseName;
      }
      
      // Se já existe, adicionar um número sequencial
      let counter = 1;
      let newName = `${baseName}${counter}`;
      
      while (existingNames.includes(newName)) {
        counter++;
        newName = `${baseName}${counter}`;
      }
      
      return newName;
    } catch (error) {
      console.error("Erro ao verificar nome de instância:", error);
      // Em caso de erro, adiciona um timestamp para garantir unicidade
      return `${baseName}_${Date.now().toString().slice(-6)}`;
    }
  }

  // Criar uma nova instância de WhatsApp
  async createInstance(instanceName: string): Promise<EvolutionInstance | null> {
    try {
      const uniqueName = await this.getUniqueInstanceName(instanceName);
      
      const data = await this.fetchWithHeaders("/instance/create", {
        method: "POST",
        body: JSON.stringify({
          instanceName: uniqueName,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        })
      }) as CreateInstanceResponse;
      
      return {
        instanceName: data.instance.instanceName,
        instanceId: data.instance.instanceId,
        integration: data.instance.integration,
        status: data.instance.status,
        qrcode: data.qrcode
      };
    } catch (error) {
      console.error("Erro ao criar instância:", error);
      toast.error("Não foi possível criar a instância de WhatsApp");
      return null;
    }
  }

  // Obter o QR Code de uma instância
  async refreshQrCode(instanceName: string): Promise<string | null> {
    try {
      const data = await this.fetchWithHeaders(`/instance/qrcode?instanceName=${instanceName}`, {
        method: "GET"
      });
      
      if (data && data.qrcode && data.qrcode.base64) {
        return data.qrcode.base64;
      }
      
      throw new Error("QR Code não disponível");
    } catch (error) {
      console.error("Erro ao obter QR Code:", error);
      toast.error("Não foi possível obter o QR Code");
      return null;
    }
  }

  // Deletar uma instância
  async deleteInstance(instanceName: string): Promise<boolean> {
    try {
      await this.fetchWithHeaders(`/instance/delete`, {
        method: "DELETE",
        body: JSON.stringify({
          instanceName
        })
      });
      
      toast.success(`Instância ${instanceName} removida com sucesso`);
      return true;
    } catch (error) {
      console.error("Erro ao deletar instância:", error);
      toast.error("Não foi possível remover a instância");
      return false;
    }
  }

  // Verificar o status de uma instância
  async checkInstanceStatus(instanceName: string): Promise<"connected" | "connecting" | "disconnected"> {
    try {
      const data = await this.fetchWithHeaders(`/instance/connectionState?instanceName=${instanceName}`, {
        method: "GET"
      });
      
      return data.state || "disconnected";
    } catch (error) {
      console.error("Erro ao verificar status da instância:", error);
      return "disconnected";
    }
  }
}

export const evolutionApiService = new EvolutionApiService(API_URL, API_KEY);
