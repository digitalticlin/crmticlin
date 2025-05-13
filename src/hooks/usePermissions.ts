
import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type UserRole = 'admin' | 'seller' | 'operator' | 'custom';

interface PermissionState {
  isLoading: boolean;
  isSuperAdmin: boolean;
  isCompanyAdmin: boolean;
  role: UserRole | null;
  companyId: string | null;
  error: string | null;
  // Permission checks
  canManageUsers: boolean;
  canManageWhatsApp: boolean;
  canViewAllLeads: boolean;
  canEditAllLeads: boolean;
  canConfigureSystem: boolean;
  canAccessReports: boolean;
  canManageTeams: boolean;
}

export const usePermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<PermissionState>({
    isLoading: true,
    isSuperAdmin: false,
    isCompanyAdmin: false,
    role: null,
    companyId: null,
    error: null,
    canManageUsers: false,
    canManageWhatsApp: false,
    canViewAllLeads: false,
    canEditAllLeads: false,
    canConfigureSystem: false,
    canAccessReports: false,
    canManageTeams: false
  });

  useEffect(() => {
    const loadPermissions = async () => {
      if (!user) {
        setPermissions(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        // Check if user is super admin
        const { data: isSuperAdmin, error: superAdminError } = await supabase.rpc('is_super_admin');
        if (superAdminError) throw superAdminError;

        // Check if user is company admin
        const { data: isCompanyAdmin, error: companyAdminError } = await supabase.rpc('is_company_admin');
        if (companyAdminError) throw companyAdminError;

        // Get user's company_id
        const { data: companyId, error: companyIdError } = await supabase.rpc('get_user_company_id');
        if (companyIdError) throw companyIdError;

        // Get user's profile to determine role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profileError) throw profileError;

        const role = profile?.role as UserRole;

        // Set all permissions based on role
        setPermissions({
          isLoading: false,
          isSuperAdmin,
          isCompanyAdmin,
          role,
          companyId,
          error: null,
          canManageUsers: isSuperAdmin || isCompanyAdmin,
          canManageWhatsApp: isSuperAdmin || isCompanyAdmin,
          canViewAllLeads: isSuperAdmin || isCompanyAdmin || role === 'seller',
          canEditAllLeads: isSuperAdmin || isCompanyAdmin,
          canConfigureSystem: isSuperAdmin || isCompanyAdmin,
          canAccessReports: isSuperAdmin || isCompanyAdmin,
          canManageTeams: isSuperAdmin || isCompanyAdmin
        });

      } catch (error: any) {
        console.error('Error loading permissions:', error);
        setPermissions(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Erro ao carregar permissões'
        }));
      }
    };

    loadPermissions();
  }, [user]);

  return permissions;
};
