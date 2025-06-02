
import { VPS_CONFIG } from "../config/vpsConfig";
import { ServiceResponse } from "../types/whatsappWebTypes";

export class ServerMonitoringService {
  static async checkServerHealth(): Promise<ServiceResponse> {
    try {
      console.log('[Server Monitor] Checking WhatsApp server health...');
      
      const response = await fetch(`${VPS_CONFIG.baseUrl}/health`);
      
      if (!response.ok) {
        throw new Error(`Server health check failed: HTTP ${response.status}`);
      }

      const healthData = await response.json();
      
      return {
        success: true,
        data: {
          isOnline: true,
          server: healthData.server || 'WhatsApp Permanent Server',
          version: healthData.version || '2.0.0',
          uptime: healthData.uptime || 0,
          activeInstances: healthData.active_instances || 0,
          timestamp: healthData.timestamp,
          sslFixEnabled: healthData.ssl_fix_enabled === true,
          timeoutFixEnabled: healthData.timeout_fix_enabled === true
        }
      };

    } catch (error) {
      console.error('[Server Monitor] Health check failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: {
          isOnline: false,
          server: 'WhatsApp Permanent Server',
          version: 'Unknown',
          uptime: 0,
          activeInstances: 0,
          timestamp: new Date().toISOString(),
          sslFixEnabled: false,
          timeoutFixEnabled: false
        }
      };
    }
  }

  static async getServerInfo(): Promise<ServiceResponse> {
    try {
      const healthCheck = await this.checkServerHealth();
      
      if (!healthCheck.success) {
        return healthCheck;
      }

      return {
        success: true,
        data: {
          ...healthCheck.data,
          host: VPS_CONFIG.host,
          port: VPS_CONFIG.port,
          baseUrl: VPS_CONFIG.baseUrl
        }
      };

    } catch (error) {
      console.error('[Server Monitor] Get server info failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async listInstances(): Promise<ServiceResponse> {
    try {
      console.log('[Server Monitor] Listing active instances...');
      
      const response = await fetch(`${VPS_CONFIG.baseUrl}/instances`);
      
      if (!response.ok) {
        throw new Error(`Failed to list instances: HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to list instances');
      }

      return {
        success: true,
        data: result.instances || []
      };

    } catch (error) {
      console.error('[Server Monitor] List instances failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: []
      };
    }
  }

  static async deployServer(): Promise<ServiceResponse> {
    try {
      console.log('[Server Monitor] Deploying WhatsApp server...');
      
      const response = await fetch('https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/deploy_whatsapp_server', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Deployment failed: HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Deployment failed');
      }

      return {
        success: true,
        data: result
      };

    } catch (error) {
      console.error('[Server Monitor] Deployment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
