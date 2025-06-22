
// Export all services and types from orphan recovery system
export { HealthCheckService } from './healthCheckService';
export type { 
  OrphanInstance, 
  HealthCheckResult, 
  AdoptionResult, 
  StatusCheckResult 
} from './types';

// Main service class that combines all functionality
export class OrphanInstanceRecoveryService {
  // Detection methods
  static async findOrphanInstances(companyId: string) {
    const { OrphanDetectionService } = await import('./orphanDetectionService');
    return OrphanDetectionService.findOrphanInstances(companyId);
  }
  
  // VPS Instance methods
  static async getVPSInstances() {
    const { VPSInstanceService } = await import('./vpsInstanceService');
    return VPSInstanceService.getVPSInstances();
  }
  
  static async checkInstanceStatus(instanceId: string) {
    const { VPSInstanceService } = await import('./vpsInstanceService');
    return VPSInstanceService.checkInstanceStatus(instanceId);
  }
  
  // Adoption methods
  static async adoptOrphanInstance(orphanInstance: any, createdByUserId: string, instanceName: string) {
    const { OrphanAdoptionService } = await import('./orphanAdoptionService');
    return OrphanAdoptionService.adoptOrphanInstance(orphanInstance, createdByUserId, instanceName);
  }
  
  // Health check methods
  static async performHealthCheck(companyId: string) {
    const { HealthCheckService } = await import('./healthCheckService');
    return HealthCheckService.performHealthCheck(companyId);
  }
}
