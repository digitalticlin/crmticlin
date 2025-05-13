
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { Loader2 } from "lucide-react";

interface PermissionGateProps {
  children: ReactNode;
  requiredPermission?: keyof ReturnType<typeof usePermissions>;
  fallbackPath?: string;
}

/**
 * Component that renders children only if the user has the required permission
 * If not, it redirects to the fallback path
 */
const PermissionGate = ({ 
  children, 
  requiredPermission,
  fallbackPath = "/dashboard" 
}: PermissionGateProps) => {
  const permissions = usePermissions();
  
  // Se ainda estamos carregando, mostre um indicador de carregamento
  if (permissions.isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-ticlin" />
      </div>
    );
  }
  
  // Se não há uma permissão específica necessária, renderize os filhos
  if (!requiredPermission) {
    return <>{children}</>;
  }
  
  // Se o usuário tem a permissão necessária, renderize os filhos
  if (permissions[requiredPermission] === true) {
    return <>{children}</>;
  }
  
  // Se o usuário não tem a permissão necessária, redirecione para o caminho de fallback
  return <Navigate to={fallbackPath} replace />;
};

export default PermissionGate;
