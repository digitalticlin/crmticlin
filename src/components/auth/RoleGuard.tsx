import React from 'react';
import { useUserPermissions, UserRole } from '@/hooks/useUserPermissions';
import { AlertTriangle, Lock, ArrowLeft } from 'lucide-react';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showDeniedMessage?: boolean;
}

interface AccessDeniedProps {
  userRole: UserRole | null;
  allowedRoles: UserRole[];
}

const AccessDenied: React.FC<AccessDeniedProps> = ({ userRole, allowedRoles }) => {
  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/dashboard';
    }
  };

  const getRoleDisplayName = (role: UserRole | null): string => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'operational': return 'Operacional';
      default: return 'Indefinida';
    }
  };

  const getAllowedRolesDisplay = (): string => {
    return allowedRoles.map(getRoleDisplayName).join(' ou ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-red-600" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Acesso Restrito
        </h1>

        {/* Message */}
        <div className="mb-6">
          <div className="flex items-center justify-center mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" />
            <span className="text-gray-700">
              Você não tem permissão para acessar esta área
            </span>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-600">Sua função:</span>
                <p className="text-gray-900 mt-1">{getRoleDisplayName(userRole)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Necessário:</span>
                <p className="text-gray-900 mt-1">{getAllowedRolesDisplay()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleGoBack}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </button>
          
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Ir para Dashboard
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Entre em contato com o administrador se você acredita que deveria ter acesso a esta área.
          </p>
        </div>
      </div>
    </div>
  );
};

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  children,
  fallback,
  showDeniedMessage = true
}) => {
  const { permissions, loading } = useUserPermissions();

  console.log('[RoleGuard] 🛡️ Verificando permissões:', {
    userRole: permissions.role,
    allowedRoles,
    loading,
    hasAccess: permissions.role ? allowedRoles.includes(permissions.role) : false
  });

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Check access
  const hasAccess = permissions.role && allowedRoles.includes(permissions.role);

  if (!hasAccess) {
    console.log('[RoleGuard] ❌ Acesso negado:', {
      userRole: permissions.role,
      allowedRoles
    });

    // Custom fallback
    if (fallback) {
      return <>{fallback}</>;
    }

    // Show denied message
    if (showDeniedMessage) {
      return <AccessDenied userRole={permissions.role} allowedRoles={allowedRoles} />;
    }

    // Return nothing (hidden)
    return null;
  }

  console.log('[RoleGuard] ✅ Acesso permitido');
  return <>{children}</>;
};

export default RoleGuard;