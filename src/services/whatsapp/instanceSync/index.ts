
// Main entry point for instance synchronization module
export { DualCreationService } from './dualCreationService';
export { InstanceSyncService } from './instanceSyncService';
export type { 
  DualCreationParams, 
  DualCreationResult, 
  SyncResult, 
  VPSInstanceData 
} from './types';

// Unified service class combining both functionalities
export class InstanceSyncManager {
  /**
   * Cria instância usando criação dual (DB + VPS)
   */
  static async createInstance(params: { instanceName?: string; userEmail: string; companyId?: string }) {
    const { DualCreationService } = await import('./dualCreationService');
    return DualCreationService.createInstanceDual({
      instanceName: params.instanceName || '',
      userEmail: params.userEmail,
      companyId: params.companyId || ''
    });
  }

  /**
   * Sincroniza todas as instâncias VPS → Supabase
   */
  static async syncAllInstances() {
    const { InstanceSyncService } = await import('./instanceSyncService');
    return InstanceSyncService.syncAllInstances();
  }

  /**
   * Agenda sincronização automática
   */
  static scheduleAutoSync(intervalMinutes: number = 15) {
    // Use dynamic import without await since this is sync scheduling
    import('./instanceSyncService').then(({ InstanceSyncService }) => {
      return InstanceSyncService.scheduleAutoSync(intervalMinutes);
    });
  }
}
