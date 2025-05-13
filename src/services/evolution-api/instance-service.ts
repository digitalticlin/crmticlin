
import { ApiClient } from "./api-client";
import { EvolutionInstance } from "./types";
import { InstanceFetchService } from "./instance-fetch-service";
import { InstanceCreationService } from "./instance-creation-service";
import { InstanceConnectionService } from "./instance-connection-service";
import { InstanceDeletionService } from "./instance-deletion-service";

/**
 * Main service that coordinates Evolution API instance operations
 * Acts as a facade for specialized services
 */
export class InstanceService {
  private fetchService: InstanceFetchService;
  private creationService: InstanceCreationService;
  private connectionService: InstanceConnectionService;
  private deletionService: InstanceDeletionService;
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.fetchService = new InstanceFetchService(apiClient);
    this.creationService = new InstanceCreationService(apiClient);
    this.connectionService = new InstanceConnectionService(apiClient);
    this.deletionService = new InstanceDeletionService(apiClient);
  }

  /**
   * Fetches all existing instances
   */
  async fetchInstances(): Promise<EvolutionInstance[]> {
    return this.fetchService.fetchInstances();
  }

  /**
   * Generates a unique instance name
   */
  async getUniqueInstanceName(baseName: string): Promise<string> {
    return this.creationService.getUniqueInstanceName(baseName);
  }

  /**
   * Creates a new WhatsApp instance
   */
  async createInstance(instanceName: string): Promise<EvolutionInstance | null> {
    return this.creationService.createInstance(instanceName);
  }

  /**
   * Forcefully connects to WhatsApp and gets a fresh QR code
   */
  async connectInstance(instanceName: string): Promise<string | null> {
    return this.connectionService.connectInstance(instanceName);
  }

  /**
   * Gets or refreshes the QR Code for an instance
   */
  async refreshQrCode(instanceName: string): Promise<string | null> {
    return this.connectionService.refreshQrCode(instanceName);
  }

  /**
   * Checks the connection status of an instance
   */
  async checkInstanceStatus(instanceName: string): Promise<"connected" | "connecting" | "disconnected"> {
    return this.connectionService.checkInstanceStatus(instanceName);
  }

  /**
   * Deletes an instance
   */
  async deleteInstance(instanceName: string): Promise<boolean> {
    const result = await this.deletionService.deleteInstance(instanceName);
    if (result) {
      // Invalidate cache after successful deletion
      this.fetchService.invalidateCache();
    }
    return result;
  }
  
  /**
   * Gets device information for a connected instance
   */
  async getDeviceInfo(instanceName: string): Promise<any | null> {
    try {
      console.log(`Obtendo informações do dispositivo para: "${instanceName}"`);
      // Endpoint corrigido para obter informações do dispositivo
      const response = await this.apiClient.fetchWithHeaders(`/instance/deviceInfo/${instanceName}`, {
        method: "GET"
      });
      
      console.log("Resposta de deviceInfo:", response);
      
      if (!response || response.status === 'error') {
        console.log("Erro ao obter informações do dispositivo, tentando fallback");
        
        // Fallback: use /instance/info endpoint que também pode conter informações do dispositivo
        try {
          const infoResponse = await this.apiClient.fetchWithHeaders(`/instance/info/${instanceName}`, {
            method: "GET"
          });
          
          if (infoResponse && infoResponse.instance && infoResponse.instance.phone) {
            return {
              status: 'success',
              device: {
                phone: infoResponse.instance.phone,
                battery: infoResponse.instance.battery || { value: 0 },
                wa_version: infoResponse.instance.waVersion || "Desconhecido",
                platform: infoResponse.instance.platform || "Unknown"
              }
            };
          }
        } catch (fallbackError) {
          console.error("Erro no fallback para obter informações do dispositivo:", fallbackError);
        }
        
        return null;
      }
      
      return response;
    } catch (error) {
      console.error("Erro ao obter informações do dispositivo:", error);
      return null;
    }
  }
}
