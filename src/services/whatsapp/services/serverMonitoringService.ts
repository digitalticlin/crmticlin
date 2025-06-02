
import { VPS_CONFIG, getEndpointUrl, getRequestHeaders } from "../config/vpsConfig";
import { ServiceResponse, ServerHealthResponse } from "../types/whatsappWebTypes";

export class ServerMonitoringService {
  static async checkServerHealth(): Promise<ServerHealthResponse> {
    try {
      console.log('Checking WhatsApp Web.js server health...');
      
      const response = await fetch(getEndpointUrl('/health'), {
        method: 'GET',
        headers: getRequestHeaders(),
        signal: AbortSignal.timeout(VPS_CONFIG.timeout)
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: {
          status: data.status || 'online',
          uptime: data.uptime,
          activeInstances: data.active_instances || 0,
          timestamp: data.timestamp || new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Error checking server health:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown server error'
      };
    }
  }

  static async getServerInfo(): Promise<ServiceResponse> {
    try {
      const response = await fetch(getEndpointUrl('/status'), {
        method: 'GET',
        headers: getRequestHeaders(),
        signal: AbortSignal.timeout(VPS_CONFIG.timeout)
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };

    } catch (error) {
      console.error('Error getting server info:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async listInstances(): Promise<ServiceResponse> {
    try {
      const response = await fetch(getEndpointUrl('/instances'), {
        method: 'GET',
        headers: getRequestHeaders(),
        signal: AbortSignal.timeout(VPS_CONFIG.timeout)
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data: data.instances || [] };

    } catch (error) {
      console.error('Error listing instances:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
