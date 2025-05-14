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
  async createInstance(instanceName: string): Promise<EvolutionInstance> {
    try {
      console.log(`Creating instance: ${instanceName}`);
      const response = await this.apiClient.fetchWithHeaders(`/instance/create/${instanceName}`, { method: "GET" });
      return response;
    } catch (error) {
      console.error(`Error creating instance ${instanceName}:`, error);
      throw error;
    }
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
