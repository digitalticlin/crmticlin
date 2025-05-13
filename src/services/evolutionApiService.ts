
import { toast } from "sonner";

// Interfaces
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

// API Configuration
const API_URL = "https://ticlin-evolution-api.eirfpl.easypanel.host";
const API_KEY = "JTZZDXMpymy7RETTvXdA9VxKdD0Mdj7t";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // milliseconds

/**
 * Class to handle HTTP requests with Evolution API
 */
class ApiClient {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;

    // Validate API URL and key
    if (!apiUrl || apiUrl.trim() === "") {
      console.error("Invalid API URL provided");
    }
    
    if (!apiKey || apiKey.trim() === "") {
      console.error("Invalid API key provided");
    }
  }

  /**
   * Performs HTTP requests with standard headers for the API with retry logic
   */
  async fetchWithHeaders(endpoint: string, options: RequestInit = {}, retries = 0): Promise<any> {
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
        const errorData = await response.json().catch(() => ({
          error: `HTTP error: ${response.status} ${response.statusText}`
        }));
        
        const errorMessage = errorData?.error || `Error with request: ${response.status}`;
        console.error(`API error on ${endpoint}:`, errorMessage);
        
        // Implement retry logic for server errors (5xx)
        if (retries < MAX_RETRIES && response.status >= 500) {
          console.log(`Retrying request to ${endpoint} (attempt ${retries + 1} of ${MAX_RETRIES})...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          return this.fetchWithHeaders(endpoint, options, retries + 1);
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      // Only retry network errors or timeouts
      if (retries < MAX_RETRIES && (error.name === "TypeError" || error.name === "AbortError")) {
        console.log(`Network error, retrying request to ${endpoint} (attempt ${retries + 1} of ${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return this.fetchWithHeaders(endpoint, options, retries + 1);
      }
      
      console.error(`Failed request to ${endpoint} after ${retries} retries:`, error);
      throw error;
    }
  }
}

/**
 * Class to manage Evolution API instances
 */
class EvolutionApiService {
  private apiClient: ApiClient;
  private cachedInstances: EvolutionInstance[] | null = null;
  private lastFetchTime: number = 0;
  private fetchPromise: Promise<EvolutionInstance[]> | null = null;
  private cacheTTL = 60000; // 1 minute cache

  constructor(apiUrl: string, apiKey: string) {
    this.apiClient = new ApiClient(apiUrl, apiKey);
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
        throw new Error("Invalid response from API when fetching instances");
      }
      
      console.log(`Successfully fetched ${data.instances.length} instances`);
      return data.instances;
    } catch (error) {
      this.handleApiError(error, "Não foi possível obter as instâncias existentes");
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
      return this.generateUniqueNameFromExisting(baseName, instances);
    } catch (error) {
      console.error("Error when checking instance name:", error);
      // Try again with a lighter approach - don't show toast on this internal error
      this.handleApiError(error, "Erro ao verificar nome de instância", false);
      
      // Instead of immediately falling back to a timestamp-based name,
      // try again with a basic sequential approach
      return `${baseName}1`;
    }
  }

  /**
   * Generates a unique name based on existing instances
   * Uses sequential numbering like baseName1, baseName2, etc.
   */
  private generateUniqueNameFromExisting(baseName: string, instances: EvolutionInstance[]): string {
    const existingNames = instances.map(instance => instance.instanceName);
    
    console.log(`Checking if "${baseName}" already exists among ${existingNames.length} instances`);
    
    // Check if the base name is already unique
    if (!existingNames.includes(baseName)) {
      console.log(`Base name "${baseName}" is unique, using it`);
      return baseName;
    }
    
    // If already exists, add a sequential number
    return this.appendSequentialNumber(baseName, existingNames);
  }

  /**
   * Adds a sequential number to the base name until it finds a unique name
   */
  private appendSequentialNumber(baseName: string, existingNames: string[]): string {
    let counter = 1;
    let newName = `${baseName}${counter}`;
    
    console.log(`Base name "${baseName}" exists, finding next available number`);
    
    while (existingNames.includes(newName)) {
      counter++;
      newName = `${baseName}${counter}`;
    }
    
    console.log(`Generated unique name: "${newName}"`);
    return newName;
  }

  /**
   * Creates a new WhatsApp instance
   */
  async createInstance(instanceName: string): Promise<EvolutionInstance | null> {
    try {
      console.log(`Creating instance with base name: "${instanceName}"`);
      const uniqueName = await this.getUniqueInstanceName(instanceName);
      
      console.log(`Using unique name for creation: "${uniqueName}"`);
      const data = await this.apiClient.fetchWithHeaders("/instance/create", {
        method: "POST",
        body: JSON.stringify({
          instanceName: uniqueName,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        })
      }) as CreateInstanceResponse;
      
      // Invalidate instance cache since we added a new one
      this.cachedInstances = null;
      
      const mappedInstance = this.mapInstanceResponse(data);
      console.log(`Successfully created instance: "${mappedInstance.instanceName}"`);
      
      return mappedInstance;
    } catch (error) {
      this.handleApiError(error, "Não foi possível criar a instância de WhatsApp");
      return null;
    }
  }

  /**
   * Maps API response to EvolutionInstance format
   */
  private mapInstanceResponse(data: CreateInstanceResponse): EvolutionInstance {
    return {
      instanceName: data.instance.instanceName,
      instanceId: data.instance.instanceId,
      integration: data.instance.integration,
      status: data.instance.status,
      qrcode: data.qrcode
    };
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
      
      this.validateQrCodeResponse(data);
      
      console.log(`Successfully refreshed QR code for "${instanceName}"`);
      return data.qrcode.base64;
    } catch (error) {
      this.handleApiError(error, "Não foi possível obter o QR Code");
      return null;
    }
  }

  /**
   * Validates the QR Code response
   */
  private validateQrCodeResponse(data: any): void {
    if (!data || !data.qrcode || !data.qrcode.base64) {
      throw new Error("QR Code não disponível na resposta da API");
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
      
      toast.success(`Instância ${instanceName} removida com sucesso`);
      console.log(`Successfully deleted instance: "${instanceName}"`);
      return true;
    } catch (error) {
      this.handleApiError(error, "Não foi possível remover a instância");
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
      this.handleApiError(error, "Erro ao verificar status da instância", false);
      return "disconnected";
    }
  }

  /**
   * Standard API error handler with toast notifications
   */
  private handleApiError(error: any, message: string, showToast: boolean = true): void {
    // Extract more specific error information if available
    const errorMessage = error?.message || "Erro desconhecido";
    
    console.error(`${message}: ${errorMessage}`, error);
    
    if (showToast) {
      toast.error(`${message}. ${errorMessage}`);
    }
  }
}

export const evolutionApiService = new EvolutionApiService(API_URL, API_KEY);
