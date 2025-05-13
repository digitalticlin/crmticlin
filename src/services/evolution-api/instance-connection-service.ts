
import { ApiClient } from "./api-client";
import { BaseService } from "./base-service";
import { handleApiError, validateQrCodeResponse } from "./helpers";

/**
 * Service responsible for Evolution API instance connection operations
 */
export class InstanceConnectionService extends BaseService {
  private connectionPromises: Map<string, Promise<string | null>> = new Map();
  private statusCheckPromises: Map<string, Promise<"connected" | "connecting" | "disconnected">> = new Map();

  constructor(apiClient: ApiClient) {
    super(apiClient);
  }

  /**
   * Forcefully connect to WhatsApp and get a fresh QR code
   * This uses the specified endpoint for direct connection
   * Deduplicates concurrent requests for the same instance
   */
  async connectInstance(instanceName: string): Promise<string | null> {
    // Check if a connection request is already in progress for this instance
    const existingPromise = this.connectionPromises.get(instanceName);
    if (existingPromise) {
      console.log(`Connection already in progress for "${instanceName}", reusing existing promise`);
      return existingPromise;
    }
    
    // Create a new connection promise
    const connectionPromise = (async () => {
      try {
        console.log(`Forcing connection for instance: "${instanceName}"`);
        
        // Log header for debugging
        console.log("Making request to /instance/connect with headers:");
        
        const data = await this.apiClient.fetchWithHeaders(`/instance/connect/${instanceName}`, {
          method: "GET"
        });
        
        console.log("Response from forced connection:", data);
        
        if (!data || !data.qrcode || !data.qrcode.base64) {
          console.error("QR code missing in connection API response:", data);
          throw new Error("QR Code not available in API response");
        }
        
        console.log(`QR code successfully obtained via forced connection for "${instanceName}"`);
        return data.qrcode.base64;
      } catch (error) {
        console.error("Error when forcing connection and getting QR code:", error);
        handleApiError(error, "Não foi possível conectar e obter o QR Code");
        return null;
      } finally {
        // Remove the promise from the map after a delay
        setTimeout(() => {
          this.connectionPromises.delete(instanceName);
        }, 1000);
      }
    })();
    
    // Store the promise
    this.connectionPromises.set(instanceName, connectionPromise);
    
    return connectionPromise;
  }

  /**
   * Gets or refreshes the QR Code for an instance
   */
  async refreshQrCode(instanceName: string): Promise<string | null> {
    // Use connectInstance instead for more reliable QR code generation
    return this.connectInstance(instanceName);
  }

  /**
   * Checks the connection status of an instance with deduplication
   */
  async checkInstanceStatus(instanceName: string): Promise<"connected" | "connecting" | "disconnected"> {
    // Check if a status check is already in progress for this instance
    const existingPromise = this.statusCheckPromises.get(instanceName);
    if (existingPromise) {
      console.log(`Status check already in progress for "${instanceName}", reusing existing promise`);
      return existingPromise;
    }
    
    // Create a new status check promise
    const statusPromise = (async () => {
      try {
        console.log(`Checking status for instance: "${instanceName}"`);
        
        // Corrigido: Usando o formato correto de URL para o endpoint de status
        // Alterado de query parameter para path parameter conforme documentação Evolution API
        const data = await this.apiClient.fetchWithHeaders(`/instance/connectionState/${instanceName}`, {
          method: "GET"
        });
        
        if (!data || !data.state) {
          console.log("Resposta de connectionState sem state, tentando fallback:", data);
          
          // Implementação de fallback usando /instance/info
          try {
            const infoData = await this.apiClient.fetchWithHeaders(`/instance/info/${instanceName}`, {
              method: "GET"
            });
            
            console.log("Resposta do fallback info:", infoData);
            if (infoData && infoData.instance) {
              // Se o número está conectado ao WhatsApp, a instância geralmente tem status 'connected'
              const isConnected = infoData.instance.status === 'connected' || 
                                 (infoData.instance.connected === true);
                                 
              return isConnected ? "connected" : "disconnected";
            }
          } catch (fallbackError) {
            console.error("Erro no fallback de verificação de status:", fallbackError);
          }
          
          throw new Error("Estado da instância não disponível na resposta");
        }
        
        console.log(`Status para "${instanceName}": ${data.state}`);
        return data.state || "disconnected";
      } catch (error) {
        console.error("Erro ao verificar status da instância:", error);
        
        // Tente o fallback de info se o connectionState falhar
        try {
          console.log("Tentando fallback via /instance/info após falha em connectionState");
          const infoData = await this.apiClient.fetchWithHeaders(`/instance/info/${instanceName}`, {
            method: "GET"
          });
          
          if (infoData && infoData.instance) {
            const statusFromInfo = infoData.instance.status === 'connected' || 
                                 (infoData.instance.connected === true) ? 
                                  "connected" : "disconnected";
            console.log(`Status obtido via fallback para "${instanceName}": ${statusFromInfo}`);
            return statusFromInfo;
          }
        } catch (fallbackError) {
          console.error("Erro também no fallback:", fallbackError);
        }
        
        handleApiError(error, "Erro ao verificar status da instância", false);
        return "disconnected";
      } finally {
        // Remove the promise from the map after a short delay
        setTimeout(() => {
          this.statusCheckPromises.delete(instanceName);
        }, 1000);
      }
    })();
    
    // Store the promise
    this.statusCheckPromises.set(instanceName, statusPromise);
    
    return statusPromise;
  }
}
