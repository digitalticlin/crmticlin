
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

  constructor(apiClient: ApiClient) {
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
}
