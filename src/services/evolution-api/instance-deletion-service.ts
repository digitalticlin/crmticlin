
import { ApiClient } from "./api-client";
import { BaseService } from "./base-service";
import { handleApiError } from "./helpers";

/**
 * Service responsible for Evolution API instance deletion
 */
export class InstanceDeletionService extends BaseService {
  constructor(apiClient: ApiClient) {
    super(apiClient);
  }

  /**
   * Deletes an instance by instanceName in the URL (no body)
   */
  async deleteInstance(instanceName: string): Promise<boolean> {
    try {
      if (!instanceName) throw new Error("Instance name is required");
      console.log(`Deleting instance (NEW): "${instanceName}"`);
      await this.apiClient.fetchWithHeaders(`/instance/delete/${encodeURIComponent(instanceName)}`, {
        method: "DELETE",
        // NO BODY!
        headers: {
          "API-KEY": "JTZZDXMpymy7RETTvXdA9VxKdD0Mdj7t",
          // Se necessário: "Content-Type": "application/json"
        }
      });
      console.log(`Successfully deleted instance (NEW): "${instanceName}"`);
      return true;
    } catch (error) {
      handleApiError(error, "Não foi possível remover a instância");
      return false;
    }
  }
}

