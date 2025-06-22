
// QR Code Management
export { QRCodeService } from './lib/qrCodeService';
export { useQRCodeGeneration } from './hooks/useQRCodeGeneration';
export { GenerateQRButton } from './components/GenerateQRButton';

// Types
export type { 
  QRCodeRequest, 
  QRCodeResult,
  QRCodeModalState
} from './types/qrCodeTypes';
