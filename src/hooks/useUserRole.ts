
// Updated to use secure user role checking
import { useSecureUserRole } from './useSecureUserRole';

// Re-export secure hook for backward compatibility
export const useUserRole = useSecureUserRole;
export type { UserRole } from './useSecureUserRole';
