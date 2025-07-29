
import { useAuth } from "@/contexts/AuthContext";

export const useCompanyData = () => {
  const { user } = useAuth();
  
  // Retorna um companyId baseado no usuário para compatibilidade
  const companyId = user?.id || 'default-company';
  
  return {
    companyId,
    companyName: 'Empresa Padrão',
    isLoading: false
  };
};
