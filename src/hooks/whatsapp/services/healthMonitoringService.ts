
import { ConnectionHealthService } from "@/services/whatsapp/services/connectionHealthService";
import { WhatsAppWebInstance } from "../types/whatsappWebInstanceTypes";

export class HealthMonitoringService {
  static startMonitoringForInstances(instances: WhatsAppWebInstance[]) {
    instances.forEach(instance => {
      if (instance.vps_instance_id && 
          ['ready', 'open'].includes(instance.web_status || '') &&
          instance.phone && instance.phone !== '') {
        console.log('[HealthMonitoringService] Starting health monitoring for CONNECTED instance:', instance.id);
        ConnectionHealthService.startHealthMonitoring(instance.id, instance.vps_instance_id);
      } else {
        console.log('[HealthMonitoringService] Skipping health monitoring for non-connected instance:', instance.id, 'Status:', instance.web_status);
      }
    });
  }

  static stopMonitoringForInstance(instanceId: string) {
    console.log('[HealthMonitoringService] Stopping health monitoring for:', instanceId);
    ConnectionHealthService.stopHealthMonitoring(instanceId);
  }

  static stopAllMonitoring() {
    console.log('[HealthMonitoringService] Stopping all health monitoring on unmount');
    ConnectionHealthService.stopAllMonitoring();
  }
}
