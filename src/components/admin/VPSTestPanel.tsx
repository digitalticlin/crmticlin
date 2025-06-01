
import { VPSConfigCard } from "./vps/VPSConfigCard";
import { TestResultsCard } from "./vps/TestResultsCard";
import { VPSDiagnosticTest } from "./VPSDiagnosticTest";
import { useVPSTest } from "./vps/useVPSTest";

export const VPSTestPanel = () => {
  const { testing, testResults, runConnectivityTest } = useVPSTest();

  const VPS_CONFIG = {
    host: '31.97.24.222',
    port: 3001,
    sshPort: 22,
    type: 'Ubuntu 4GB VPS'
  };

  return (
    <div className="space-y-6">
      <VPSConfigCard 
        config={VPS_CONFIG}
        onTest={runConnectivityTest}
        testing={testing}
      />

      {testResults && (
        <TestResultsCard 
          testResults={testResults}
          vpsConfig={VPS_CONFIG}
        />
      )}

      {/* Novo componente de diagnóstico completo */}
      <VPSDiagnosticTest />
    </div>
  );
};
