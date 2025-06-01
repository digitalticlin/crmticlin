
import { VPSHealthMonitor } from "./vpsHealthMonitor";
import { VPSInstanceManager } from "./vpsInstanceManager";

// Re-export principais funcionalidades para compatibilidade
export class VPSHealthService {
  static checkVPSHealth = VPSHealthMonitor.checkVPSHealth.bind(VPSHealthMonitor);
  static startHealthMonitoring = VPSHealthMonitor.startHealthMonitoring.bind(VPSHealthMonitor);
  static stopHealthMonitoring = VPSHealthMonitor.stopHealthMonitoring.bind(VPSHealthMonitor);
  static getHealthStatus = VPSHealthMonitor.getHealthStatus.bind(VPSHealthMonitor);
  static isVPSAccessible = VPSInstanceManager.isVPSAccessible.bind(VPSInstanceManager);
  static getVPSInstances = VPSInstanceManager.getVPSInstances.bind(VPSInstanceManager);
}

// Re-export types
export type { VPSHealthStatus } from "./vpsHealthMonitor";
