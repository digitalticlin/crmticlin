
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
      
      console.log(`Successfully deleted instance: "${instanceName}"`);
      return true;
    } catch (error) {
      handleApiError(error, "Não foi possível remover a instância");
      return false;
    }
  }
}
