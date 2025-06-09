
import { VPSConnectivityTest } from "./VPSConnectivityTest";
import { VPSConnectivitySolutions } from "./VPSConnectivitySolutions";
import { VPSNetworkDiagnostics } from "./VPSNetworkDiagnostics";

export const VPSAdvancedDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Diagnóstico Principal */}
      <VPSConnectivityTest />
      
      {/* Diagnóstico de Rede Avançado */}
      <VPSNetworkDiagnostics />
      
      {/* Soluções de Conectividade */}
      <VPSConnectivitySolutions />
    </div>
  );
};
