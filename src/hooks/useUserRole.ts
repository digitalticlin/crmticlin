
/**
 * 🚀 MIGRADO PARA USAR ROLECONTEXT
 *
 * Este hook agora é apenas um wrapper para manter compatibilidade
 * com código existente. Usa o RoleContext global ao invés de fazer
 * queries próprias.
 */

import { useRole } from "@/contexts/RoleContext";

export const useUserRole = () => {
  const { role, isAdmin, loading } = useRole();

  // Retorna no mesmo formato que o hook antigo esperava
  return {
    isAdmin,
    role: role || "operational", // Fallback para operational se null
    loading
  };
};
