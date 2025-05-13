
import { API_URL, API_KEY } from "./config";
import { ApiClient } from "./api-client";
import { InstanceService } from "./instance-service";
import { EvolutionInstance } from "./types";

// Export the types for use in other files
export type { EvolutionInstance };

// Create and export the service instance
const apiClient = new ApiClient(API_URL, API_KEY);
const instanceService = new InstanceService(apiClient);

// Export a simplified service API
export const evolutionApiService = {
  /**
   * Fetches all existing instances
   */
  fetchInstances: () => instanceService.fetchInstances(),
  
  /**
   * Creates a new WhatsApp instance
   */
  createInstance: (instanceName: string) => instanceService.createInstance(instanceName),
  
  /**
   * Refreshes the QR code for an instance
   */
  refreshQrCode: (instanceName: string) => instanceService.refreshQrCode(instanceName),
  
  /**
   * Deletes an instance
   */
  deleteInstance: (instanceName: string) => instanceService.deleteInstance(instanceName),
  
  /**
   * Checks the connection status of an instance
   */
  checkInstanceStatus: (instanceName: string) => instanceService.checkInstanceStatus(instanceName),
};
