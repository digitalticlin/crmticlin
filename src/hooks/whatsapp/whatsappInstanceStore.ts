
import { WhatsAppWebInstance } from '@/types/whatsapp';

// Mock WhatsAppInstance type for backward compatibility
export interface WhatsAppInstance extends WhatsAppWebInstance {}

// Mock store for backward compatibility
export const useWhatsAppInstanceStore = () => ({
  instances: [] as WhatsAppInstance[],
  isLoading: false,
  error: null,
  refreshInstances: () => Promise.resolve(),
  updateInstance: () => Promise.resolve(),
});
