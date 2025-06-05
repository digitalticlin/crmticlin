
// Import all services first
import { VPSInstanceService } from './vpsInstanceService';
import { OrphanDetectionService } from './orphanDetectionService';
import { OrphanAdoptionService } from './orphanAdoptionService';
import { HealthCheckService } from './healthCheckService';

// Export all services and types from orphan recovery system
export { OrphanDetectionService } from './orphanDetectionService';
export { OrphanAdoptionService } from './orphanAdoptionService';
export { VPSInstanceService } from './vpsInstanceService';
export { HealthCheckService } from './healthCheckService';
export type { 
  OrphanInstance, 
  HealthCheckResult, 
  AdoptionResult, 
  StatusCheckResult 
} from './types';

// Main service class that combines all functionality
export class OrphanInstanceRecoveryService {
  // VPS Instance methods
  static getVPSInstances = VPSInstanceService.getVPSInstances;
  static checkInstanceStatus = VPSInstanceService.checkInstanceStatus;
  
  // Detection methods
  static findOrphanInstances = OrphanDetectionService.findOrphanInstances;
  
  // Adoption methods
  static adoptOrphanInstance = OrphanAdoptionService.adoptOrphanInstance;
  
  // Health check methods
  static performHealthCheck = HealthCheckService.performHealthCheck;
}
