/**
 * 🎯 ROLE CONTEXT GLOBAL
 *
 * Centraliza o gerenciamento de roles e permissões para evitar múltiplas queries
 * e loops infinitos causados por hooks duplicados.
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'admin' | 'operational';

interface RoleContextData {
  role: UserRole | null;
  isAdmin: boolean;
  isOperational: boolean;
  loading: boolean;
  permissions: {
    canViewAllData: boolean;
    canDeleteData: boolean;
    canManageTeam: boolean;
    canAccessSettings: boolean;
    canManageFunnels: boolean;
    canManageWhatsApp: boolean;
    canViewReports: boolean;
  };
  refreshRole: () => Promise<void>;
}

const RoleContext = createContext<RoleContextData>({} as RoleContextData);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // 🚀 FETCH ROLE APENAS UMA VEZ
  const fetchRole = async () => {
    if (!user?.id) {
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      // Query única para evitar múltiplas requisições
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('[RoleContext] ❌ Erro ao buscar role:', error);
        setRole('operational'); // Fallback seguro
        return;
      }

      const userRole = (profile?.role || 'operational') as UserRole;
      setRole(userRole);

      // Log único para debug
      console.log('[RoleContext] ✅ Role carregada:', {
        userId: user.id,
        role: userRole
      });

    } catch (error) {
      console.error('[RoleContext] ❌ Erro geral:', error);
      setRole('operational'); // Fallback seguro
    } finally {
      setLoading(false);
    }
  };

  // Carregar role apenas quando user mudar
  useEffect(() => {
    if (user?.id) {
      fetchRole();
    } else {
      setRole(null);
      setLoading(false);
    }
  }, [user?.id]); // ← Dependência simples e estável

  // 🚀 MEMOIZAÇÃO: Calcular permissões baseadas na role
  const permissions = useMemo(() => {
    if (role === 'admin') {
      return {
        canViewAllData: true,
        canDeleteData: true,
        canManageTeam: true,
        canAccessSettings: true,
        canManageFunnels: true,
        canManageWhatsApp: true,
        canViewReports: true,
      };
    }

    // Operational ou null
    return {
      canViewAllData: false,
      canDeleteData: false,
      canManageTeam: false,
      canAccessSettings: false,
      canManageFunnels: false,
      canManageWhatsApp: false,
      canViewReports: false,
    };
  }, [role]);

  // 🚀 MEMOIZAÇÃO: Valores derivados
  const contextValue = useMemo(() => ({
    role,
    isAdmin: role === 'admin',
    isOperational: role === 'operational',
    loading,
    permissions,
    refreshRole: fetchRole,
  }), [role, loading, permissions]);

  return (
    <RoleContext.Provider value={contextValue}>
      {children}
    </RoleContext.Provider>
  );
};

// Hook personalizado para usar o contexto
export const useRole = () => {
  const context = useContext(RoleContext);

  if (!context) {
    throw new Error('useRole deve ser usado dentro de RoleProvider');
  }

  return context;
};

// Hooks de compatibilidade para migração gradual
export const useUserRole = () => {
  const { role, isAdmin, loading } = useRole();
  return { role, isAdmin, loading };
};

export const useUserPermissions = () => {
  const { permissions, loading } = useRole();
  return { permissions, loading };
};