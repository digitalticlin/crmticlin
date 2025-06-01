
import { WhatsAppWebInstance } from "../types/whatsappWebInstanceTypes";
import { InstanceService } from "./instanceService";

export class PollingService {
  static setupPolling(instances: WhatsAppWebInstance[], companyId: string) {
    if (!companyId || instances.length === 0) return;

    // Instâncias que precisam de sync mais frequente
    const criticalInstances = instances.filter(instance => {
      return ['waiting_scan', 'connecting', 'creating'].includes(instance.web_status || '') && 
             instance.vps_instance_id;
    });

    if (criticalInstances.length === 0) {
      console.log('[PollingService] No critical instances - no intensive polling needed');
      return;
    }

    console.log('[PollingService] Setting up INTENSIVE polling for', criticalInstances.length, 'critical instances');

    const pollInterval = setInterval(async () => {
      console.log('[PollingService] Intensive polling check for critical instances...');
      
      for (const instance of criticalInstances) {
        try {
          console.log('[PollingService] Auto-syncing critical instance:', instance.id, 'Status:', instance.web_status);
          await InstanceService.syncInstanceStatus(instance.vps_instance_id);
        } catch (error) {
          console.error('[PollingService] Intensive polling error for instance:', instance.id, error);
        }
      }
    }, 8000); // 8 segundos para instâncias críticas

    // Auto-cleanup após 10 minutos para evitar polling infinito
    const timeout = setTimeout(() => {
      console.log('[PollingService] Auto-stopping intensive polling after 10 minutes');
      clearInterval(pollInterval);
    }, 600000); // 10 minutos

    return () => {
      console.log('[PollingService] Cleaning up intensive polling interval');
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }
}
