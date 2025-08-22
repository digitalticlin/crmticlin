
// Mock store for backward compatibility
export const useWhatsAppInstanceStore = () => ({
  instances: [],
  isLoading: false,
  error: null,
  refreshInstances: () => Promise.resolve(),
  updateInstance: () => Promise.resolve(),
});
