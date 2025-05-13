import { ApiClient } from "./api-client";
import { EvolutionInstance, FetchInstancesResponse, CreateInstanceResponse } from "./types";
import { 
  generateUniqueNameFromExisting,
  handleApiError, 
  mapInstanceResponse,
  validateQrCodeResponse 
} from "./helpers";
import { CACHE_TTL } from "./config";

/**
 * Class to manage Evolution API instances
 */
export class InstanceService {
  private apiClient: ApiClient;
  private cachedInstances: EvolutionInstance[] | null = null;
  private lastFetchTime: number = 0;
  private fetchPromise: Promise<EvolutionInstance[]> | null = null;
  private cacheTTL = CACHE_TTL;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Fetches all existing instances with improved reliability
   */
  async fetchInstances(): Promise<EvolutionInstance[]> {
    const now = Date.now();
    
    // Return cached instances if available and fresh
    if (this.cachedInstances && (now - this.lastFetchTime < this.cacheTTL)) {
      return this.cachedInstances;
    }
    
    // If a fetch is already in progress, return that promise
    if (this.fetchPromise) {
      return this.fetchPromise;
    }
    
    // Start a new fetch
    this.fetchPromise = this.doFetchInstances();
    
    try {
      const instances = await this.fetchPromise;
      // Update cache
      this.cachedInstances = instances;
      this.lastFetchTime = Date.now();
      return instances;
    } catch (error) {
      console.error("Failed to fetch instances:", error);
      throw error;
    } finally {
      this.fetchPromise = null;
    }
  }
  
  /**
   * Actually performs the instance fetching
   */
  private async doFetchInstances(): Promise<EvolutionInstance[]> {
    try {
      console.log("Fetching WhatsApp instances...");
      const data = await this.apiClient.fetchWithHeaders("/instance/fetchInstances", {
        method: "GET"
      }) as FetchInstancesResponse;
      
      // Validate response
      if (!data || !Array.isArray(data.instances)) {
        console.error("Invalid response format:", data);
        throw new Error("Invalid response from API when fetching instances");
      }
      
      console.log(`Successfully fetched ${data.instances.length} instances`);
      return data.instances;
    } catch (error) {
      console.error("Error during instance fetch:", error);
      handleApiError(error, "Não foi possível obter as instâncias existentes");
      throw error; // Re-throw to handle at caller level
    }
  }

  /**
   * Checks if an instance name already exists and generates a unique one if needed
   */
  async getUniqueInstanceName(baseName: string): Promise<string> {
    try {
      console.log(`Generating unique instance name from base: "${baseName}"`);
      const instances = await this.fetchInstances();
      return generateUniqueNameFromExisting(baseName, instances);
    } catch (error) {
      console.error("Error when checking instance name:", error);
      // Try again with a lighter approach - don't show toast on this internal error
      handleApiError(error, "Erro ao verificar nome de instância", false);
      
      // Instead of immediately falling back to a timestamp-based name,
      // try again with a basic sequential approach
      return `${baseName}1`;
    }
  }

  /**
   * Creates a new WhatsApp instance
   */
  async createInstance(instanceName: string): Promise<EvolutionInstance | null> {
    try {
      console.log(`Creating instance with base name: "${instanceName}"`);
      const uniqueName = await this.getUniqueInstanceName(instanceName);
      
      console.log(`Using unique name for creation: "${uniqueName}"`);
      
      // Prepare request body
      const requestBody = {
        instanceName: uniqueName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS"
      };
      console.log("Request body:", requestBody);
      
      const response = await this.apiClient.fetchWithHeaders("/instance/create", {
        method: "POST",
        body: JSON.stringify(requestBody)
      });
      
      console.log("Response from create instance:", response);
      
      if (!response) {
        console.error("Received null/undefined response");
        throw new Error("Empty response from API");
      }
      
      const data = response as CreateInstanceResponse;
      
      // Validate response
      if (!data.instance || !data.instance.instanceName) {
        console.error("Invalid response structure:", data);
        throw new Error("Invalid response structure from API");
      }
      
      if (!data.qrcode || !data.qrcode.base64) {
        console.error("QR code missing in response:", data);
        throw new Error("QR code not found in response");
      }
      
      // Invalidate instance cache since we added a new one
      this.cachedInstances = null;
      
      const mappedInstance = mapInstanceResponse(data);
      console.log(`Successfully created instance: "${mappedInstance.instanceName}"`);
      console.log("QR code available:", !!mappedInstance.qrcode?.base64);
      
      return mappedInstance;
    } catch (error) {
      console.error("Error details for instance creation:", error);
      handleApiError(error, "Não foi possível criar a instância de WhatsApp");
      return null;
    }
  }

  /**
   * Forcefully connect to WhatsApp and get a fresh QR code
   * This uses the specified endpoint for direct connection
   */
  async connectInstance(instanceName: string): Promise<string | null> {
    try {
      console.log(`Forçando conexão para a instância: "${instanceName}"`);
      const data = await this.apiClient.fetchWithHeaders(`/instance/connect/${instanceName}`, {
        method: "GET"
      });
      
      console.log("Resposta da conexão forçada:", data);
      
      if (!data || !data.qrcode || !data.qrcode.base64) {
        console.error("QR code ausente na resposta da API de conexão:", data);
        throw new Error("QR Code não disponível na resposta da API");
      }
      
      console.log(`QR code obtido com sucesso via conexão forçada para "${instanceName}"`);
      return data.qrcode.base64;
    } catch (error) {
      console.error("Erro ao forçar conexão e obter QR code:", error);
      handleApiError(error, "Não foi possível conectar e obter o QR Code");
      return null;
    }
  }

  /**
   * Gets or refreshes the QR Code for an instance
   */
  async refreshQrCode(instanceName: string): Promise<string | null> {
    try {
      console.log(`Refreshing QR code for instance: "${instanceName}"`);
      const data = await this.apiClient.fetchWithHeaders(`/instance/qrcode?instanceName=${instanceName}`, {
        method: "GET"
      });
      
      console.log("QR code response:", data);
      
      if (!data || !data.qrcode || !data.qrcode.base64) {
        console.error("Invalid QR code response:", data);
        throw new Error("QR code not found in response");
      }
      
      console.log(`Successfully refreshed QR code for "${instanceName}"`);
      return data.qrcode.base64;
    } catch (error) {
      console.error("Error refreshing QR code:", error);
      handleApiError(error, "Não foi possível obter o QR Code");
      return null;
    }
  }

  /**
   * Deletes an instance
   */
  async deleteInstance(instanceName: string): Promise<boolean> {
    try {
      console.log(`Deleting instance: "${instanceName}"`);
      await this.apiClient.fetchWithHeaders(`/instance/delete`, {
        method: "DELETE",
        body: JSON.stringify({
          instanceName
        })
      });
      
      // Invalidate instance cache since we removed one
      this.cachedInstances = null;
      
      console.log(`Successfully deleted instance: "${instanceName}"`);
      return true;
    } catch (error) {
      handleApiError(error, "Não foi possível remover a instância");
      return false;
    }
  }

  /**
   * Checks the connection status of an instance
   */
  async checkInstanceStatus(instanceName: string): Promise<"connected" | "connecting" | "disconnected"> {
    try {
      console.log(`Checking status for instance: "${instanceName}"`);
      const data = await this.apiClient.fetchWithHeaders(`/instance/connectionState?instanceName=${instanceName}`, {
        method: "GET"
      });
      
      if (!data || !data.state) {
        throw new Error("Estado da instância não disponível na resposta");
      }
      
      console.log(`Status for "${instanceName}": ${data.state}`);
      return data.state || "disconnected";
    } catch (error) {
      handleApiError(error, "Erro ao verificar status da instância", false);
      return "disconnected";
    }
  }
}
