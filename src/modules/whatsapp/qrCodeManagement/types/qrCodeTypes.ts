
export interface QRCodeRequest {
  instanceId: string;
}

export interface QRCodeResult {
  success: boolean;
  qrCode?: string;
  connected?: boolean;
  waiting?: boolean;
  error?: string;
}

export interface QRCodeModalState {
  isOpen: boolean;
  instanceId: string | null;
  instanceName: string;
}
