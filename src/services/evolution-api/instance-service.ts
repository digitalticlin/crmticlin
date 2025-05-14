import { ApiClient } from "./api-client";
import { EvolutionInstance } from "./types";

/**
 * Class for managing WhatsApp instances
 */
export class InstanceService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Fetch all instances
   * @returns Array of instances
   */
  async fetchInstances(): Promise<EvolutionInstance[]> {
    try {
      console.log("Fetching instances...");
      const response = await this.apiClient.fetchWithHeaders("/instance/all", { method: "GET" });
      return response;
    } catch (error) {
      console.error("Error fetching instances:", error);
      throw error;
    }
  }

  /**
   * Create a new instance
   * @param instanceName Name of the instance to create
   */
  async createInstance(instanceName: string): Promise<any> {
    const url = `/instance/create`;

    // Garantir body, headers e endpoint perfeito
    const body = {
      instanceName: instanceName,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
    };

    // API KEY e Content-Type sempre no header, método sempre POST
    const response = await this.apiClient.fetchWithHeaders(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // ApiClient já insere a chave da API, mas se usar fetch direto, inclua aqui!
        },
        body: JSON.stringify(body),
      }
    );

    // Checagem dos campos essenciais
    if (
      !response ||
      !response.qrcode ||
      !response.qrcode.base64 ||
      !response.instance ||
      !response.instance.instanceId ||
      !response.instance.instanceName
    ) {
      throw new Error("QR code ou dados ausentes na resposta da Evolution API");
    }

    return {
      instanceId: response.instance.instanceId,
      instanceName: response.instance.instanceName,
      evolutionInstanceName: response.instance.instanceName,
      qrcode: response.qrcode,
      hash: response.hash || "",
      integration: response.instance.integration,
      status: response.instance.status,
    };
  }

  /**
   * Delete an instance
   * @param instanceName Name of the instance to delete
   */
  async deleteInstance(instanceName: string): Promise<EvolutionInstance> {
    try {
      console.log(`Deleting instance: ${instanceName}`);
      const response = await this.apiClient.fetchWithHeaders(`/instance/delete/${instanceName}`, { method: "GET" });
      return response;
    } catch (error) {
      console.error(`Error deleting instance ${instanceName}:`, error);
      throw error;
    }
  }

  /**
   * Refresh the QR code for an instance
   * @param instanceName Name of the instance to refresh the QR code for
   */
  async refreshQrCode(instanceName: string): Promise<EvolutionInstance> {
    try {
      console.log(`Refreshing QR code for instance: ${instanceName}`);
      const response = await this.apiClient.fetchWithHeaders(`/instance/qrcode/${instanceName}`, { method: "GET" });
      return response;
    } catch (error) {
      console.error(`Error refreshing QR code for instance ${instanceName}:`, error);
      throw error;
    }
  }

  /**
   * Check instance connection status
   * @param instanceName Name of the instance to check
   * @returns Status string
   */
  async connectInstance(instanceName: string): Promise<string> {
    try {
      console.log(`Connecting instance: ${instanceName}`);
      const response = await this.apiClient.fetchWithHeaders(`/instance/connect/${instanceName}`, { method: "GET" });
      return response?.qrcode?.base64 || '';
    } catch (error) {
      console.error(`Error connecting instance ${instanceName}:`, error);
      throw error;
    }
  }

  /**
   * Get device information for an instance
   * @param instanceName Name of the instance to get device info for
   */
  async getDeviceInfo(instanceName: string): Promise<any> {
    try {
      console.log(`Getting device info for instance: ${instanceName}`);
      const response = await this.apiClient.fetchWithHeaders(`/instance/device/${instanceName}`, { method: "GET" });
      return response;
    } catch (error) {
      console.error(`Error getting device info for instance ${instanceName}:`, error);
      throw error;
    }
  }

  /**
   * Check instance connection status CORRIGIDO: nunca usar /info/ para status simples.
   * @param instanceName Name of the instance to check
   * @param detailed Whether to return detailed information
   * @returns Status string or detailed info object
   */
  async checkInstanceStatus(instanceName: string, detailed: boolean = false): Promise<string | any> {
    try {
      console.log(`Checking instance status: ${instanceName}, detailed: ${detailed}`);

      if (detailed) {
        // Get full instance information (legítimo!)
        const response = await this.apiClient.fetchWithHeaders(
          `/instance/info/${instanceName}`,
          { method: "GET" }
        );
        return response;
      } else {
        // Para status simples, sempre usar connectionState!
        const response = await this.apiClient.fetchWithHeaders(
          `/instance/connectionState/${instanceName}`,
          { method: "GET" }
        );
        return response?.state || 'disconnected';
      }
    } catch (error) {
      console.error(`Error checking instance status for ${instanceName}:`, error);
      return 'disconnected';
    }
  }
}
