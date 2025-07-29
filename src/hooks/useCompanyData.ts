
import { useAuth } from "@/contexts/AuthContext";

export function useCompanyData() {
  const { user } = useAuth();
  
  // Na nova estrutura multi-tenant, o "company" é identificado pelo created_by_user_id
  // que é o primeiro admin (owner) da organização
  return {
    companyId: user?.id || null, // O próprio user ID serve como company ID
    userId: user?.id || null, // Adicionar userId para compatibilidade
    loading: false, // Adicionar loading para compatibilidade
  };
}
