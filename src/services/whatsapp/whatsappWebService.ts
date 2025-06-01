
// Main WhatsApp Web Service - now acts as a facade for smaller services
export type { WhatsAppWebInstance, ServiceResponse, InstanceResponse } from "./types/whatsappWebTypes";

import { InstanceManagementService } from "./services/instanceManagementService";
import { InstanceStatusService } from "./services/instanceStatusService";
import { MessagingService } from "./services/messagingService";
import { ServerMonitoringService } from "./services/serverMonitoringService";
import { ForceSyncService } from "./services/forceSyncService";

export class WhatsAppWebService {
  // Instance Management
  static createInstance = InstanceManagementService.createInstance;
  static deleteInstance = InstanceManagementService.deleteInstance;

  // Instance Status
  static getInstanceStatus = InstanceStatusService.getInstanceStatus;
  static getQRCode = InstanceStatusService.getQRCode;
  static syncInstanceStatus = InstanceStatusService.syncInstanceStatus;
  static forceSync = ForceSyncService.forceSync;

  // Messaging
  static sendMessage = MessagingService.sendMessage;

  // Server Monitoring
  static checkServerHealth = ServerMonitoringService.checkServerHealth;
  static getServerInfo = ServerMonitoringService.getServerInfo;
  static listInstances = ServerMonitoringService.listInstances;
}
