
import { VPSDeepDiagnostic } from "./VPSDeepDiagnostic";
import { VPSNetworkAnalyzer } from "./VPSNetworkAnalyzer";
import { VPSProcessAnalyzer } from "./VPSProcessAnalyzer";
import { VPSComprehensiveDiagnostic } from "./VPSComprehensiveDiagnostic";

export const VPSAdvancedDiagnostic = () => {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Diagnóstico Avançado VPS</h2>
        <p className="text-muted-foreground">
          Análise profunda para identificar a causa raiz do erro 404 e problemas de conectividade.
        </p>
      </div>
      
      {/* Diagnóstico Completo - NOVA FERRAMENTA PRINCIPAL */}
      <VPSComprehensiveDiagnostic />
      
      <VPSDeepDiagnostic />
      <VPSNetworkAnalyzer />
      <VPSProcessAnalyzer />
    </div>
  );
};
