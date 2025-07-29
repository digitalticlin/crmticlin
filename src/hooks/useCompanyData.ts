
import { useAuth } from "@/contexts/AuthContext";

export const useCompanyData = () => {
  const { user } = useAuth();
  
  // Retorna um companyId baseado no usuário para compatibilidade
  const companyId = user?.id || 'default-company';
  const userId = user?.id || null;
  
  return {
    companyId,
    userId,
    companyName: 'Empresa Padrão',
    isLoading: false
  };
};
