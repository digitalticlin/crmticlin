
// QR Code Management
export { QRCodeService } from './lib/qrCodeService';
export { useQRCodeGeneration } from './hooks/useQRCodeGeneration';
export { GenerateQRButton } from './components/GenerateQRButton';
export { QRCodeModal } from './components/QRCodeModal';

// Types
export type { 
  QRCodeRequest, 
  QRCodeResult,
  QRCodeModalState
} from './types/qrCodeTypes';
