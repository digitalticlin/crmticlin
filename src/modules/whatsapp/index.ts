
// Instance Creation
export { InstanceCreationService } from './instanceCreation/lib/instanceCreation';
export { InstanceApi } from './instanceCreation/api/instanceApi';
export { useInstanceCreation } from './instanceCreation/hooks/useInstanceCreation';
export { CreateInstanceButton } from './instanceCreation/components/CreateInstanceButton';

// New Hook-based Architecture 
export { useQRModal } from './hooks/useQRModal';
export { QRCodeModal } from './components/QRCodeModal';
export { qrModalManager } from './core/QRModalManager';

// Types
export type { 
  CreateInstanceParams, 
  CreateInstanceResult,
  QRCodeModalState,
  WhatsAppInstance 
} from './instanceCreation/types/instanceTypes';
