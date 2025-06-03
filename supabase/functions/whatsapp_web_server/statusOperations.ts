
// Re-export all functions from the new modular structure for backward compatibility
export { getInstanceStatus, getQRCode } from './instanceStatusService.ts';
export { checkServerHealth, getServerInfo } from './serverHealthService.ts';
export { syncInstances } from './instanceSyncService.ts';
