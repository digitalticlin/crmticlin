
import { ApiClient } from "./api-client";
import { BaseService } from "./base-service";
import { EvolutionInstance, CreateInstanceResponse } from "./types";
import { 
  generateUniqueNameFromExisting,
  handleApiError,
  mapInstanceResponse
} from "./helpers";
import { CACHE_TTL } from "./config";

/**
 * Service responsible for creating Evolution API instances
 */
export class InstanceCreationService extends BaseService {
  private cachedInstances: EvolutionInstance[] | null = null;
  private lastFetchTime: number = 0;
  private cacheTTL = CACHE_TTL;

  constructor(apiClient: ApiClient) {
    super(apiClient);
  }

  /**
   * Checks if an instance name already exists and generates a unique one if needed
   * Uses cache when possible to reduce API calls
   */
  async getUniqueInstanceName(baseName: string): Promise<string> {
    try {
      console.log(`Generating unique instance name from base: "${baseName}"`);
      
      // Fetch instances or use cached ones
      let instances: EvolutionInstance[];
      
      try {
        // Use cached instances if available instead of fetching again
        if (this.cachedInstances && (Date.now() - this.lastFetchTime < this.cacheTTL)) {
          console.log("Using cached instances for name check");
          instances = this.cachedInstances;
        } else {
          // Fetch instances if needed
          console.log("Fetching instances from API for name check");
          instances = await this.apiClient.fetchWithHeaders("/instance/fetchInstances", {
            method: "GET"
          }).then(data => {
            if (data && Array.isArray(data.instances)) {
              return data.instances;
            }
            console.log("No instances returned or invalid format from API");
            return [];
          });
          
          // Update cache
          this.cachedInstances = instances;
          this.lastFetchTime = Date.now();
          console.log(`Cached ${instances.length} instances`);
        }
      } catch (error) {
        console.error("Error fetching instances for name check:", error);
        // Return fallback in case of error
        return `${baseName}1`;
      }
      
      const uniqueName = generateUniqueNameFromExisting(baseName, instances);
      console.log(`Generated unique name: ${uniqueName}`);
      return uniqueName;
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
      
      // Make the API call to create the instance
      console.log("Sending POST request to /instance/create");
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
}
