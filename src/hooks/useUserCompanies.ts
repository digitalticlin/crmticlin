
import { useEffect, useState } from "react";

// Hook para buscar empresas do usuário (multiempresa)
// Note: Since companies table doesn't exist, returning empty for now
export function useUserCompanies(userId?: string | null) {
  const [companies, setCompanies] = useState<{ id: string, name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Since companies table doesn't exist in the current schema,
    // we'll return empty arrays for now
    setLoading(false);
    setCompanies([]);
  }, [userId]);

  return { companies, loading };
}
