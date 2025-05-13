
import { ApiClient } from "./api-client";
import { BaseService } from "./base-service";
import { EvolutionInstance, FetchInstancesResponse } from "./types";
import { handleApiError } from "./helpers";
import { CACHE_TTL } from "./config";

/**
 * Service responsible for fetching Evolution API instances
 */
export class InstanceFetchService extends BaseService {
  private cachedInstances: EvolutionInstance[] | null = null;
  private lastFetchTime: number = 0;
  private fetchPromise: Promise<EvolutionInstance[]> | null = null;
  private cacheTTL = CACHE_TTL;

  constructor(apiClient: ApiClient) {
    super(apiClient);
  }

  /**
   * Fetches all existing instances with improved reliability and caching
   */
  async fetchInstances(): Promise<EvolutionInstance[]> {
    const now = Date.now();
    
    // Return cached instances if available and fresh
    if (this.cachedInstances && (now - this.lastFetchTime < this.cacheTTL)) {
      console.log(`Using cached instances (age: ${(now - this.lastFetchTime) / 1000}s)`);
      return this.cachedInstances;
    }
    
    // If a fetch is already in progress, return that promise
    if (this.fetchPromise) {
      console.log("Using existing fetch promise for instances");
      return this.fetchPromise;
    }
    
    // Start a new fetch
    console.log("Starting new fetch for instances");
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
   * Invalidates the instance cache
   */
  invalidateCache(): void {
    this.cachedInstances = null;
    this.lastFetchTime = 0;
  }
}
